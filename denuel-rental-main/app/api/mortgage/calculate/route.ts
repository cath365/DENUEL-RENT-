import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getUser } from '@/lib/auth';

interface MortgageInput {
  homePrice: number;
  downPayment: number;
  interestRate: number;
  loanTermYears: number;
  propertyTax?: number;      // Annual property tax
  homeInsurance?: number;    // Annual home insurance
  hoaFees?: number;          // Monthly HOA fees
  includePMI?: boolean;      // Include Private Mortgage Insurance if down payment < 20%
}

interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
}

function calculateMortgage(input: MortgageInput) {
  const {
    homePrice,
    downPayment,
    interestRate,
    loanTermYears,
    propertyTax = 0,
    homeInsurance = 0,
    hoaFees = 0,
    includePMI = true,
  } = input;

  const loanAmount = homePrice - downPayment;
  const downPaymentPct = (downPayment / homePrice) * 100;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTermYears * 12;

  // Calculate monthly principal & interest using amortization formula
  let monthlyPI: number;
  if (monthlyRate === 0) {
    monthlyPI = loanAmount / numPayments;
  } else {
    monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  // Monthly property tax
  const monthlyPropertyTax = propertyTax / 12;

  // Monthly home insurance
  const monthlyInsurance = homeInsurance / 12;

  // PMI - typically 0.5-1% of loan annually if down payment < 20%
  let monthlyPMI = 0;
  if (includePMI && downPaymentPct < 20) {
    monthlyPMI = (loanAmount * 0.0075) / 12; // 0.75% annual PMI rate
  }

  // Total monthly payment
  const totalMonthlyPayment = monthlyPI + monthlyPropertyTax + monthlyInsurance + hoaFees + monthlyPMI;

  // Calculate amortization schedule
  const amortization: AmortizationEntry[] = [];
  let balance = loanAmount;
  let totalInterest = 0;

  for (let month = 1; month <= numPayments; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPI - interestPayment;
    balance -= principalPayment;
    totalInterest += interestPayment;

    // Only include key months to reduce data size
    if (month <= 12 || month % 12 === 0 || month === numPayments) {
      amortization.push({
        month,
        payment: Math.round(monthlyPI * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        balance: Math.max(0, Math.round(balance * 100) / 100),
        totalInterest: Math.round(totalInterest * 100) / 100,
      });
    }
  }

  return {
    homePrice,
    downPayment,
    downPaymentPct: Math.round(downPaymentPct * 100) / 100,
    loanAmount,
    interestRate,
    loanTermYears,
    monthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
    principalInterest: Math.round(monthlyPI * 100) / 100,
    propertyTax: Math.round(monthlyPropertyTax * 100) / 100,
    homeInsurance: Math.round(monthlyInsurance * 100) / 100,
    hoaFees,
    pmi: Math.round(monthlyPMI * 100) / 100,
    totalInterestPaid: Math.round(totalInterest * 100) / 100,
    totalCost: Math.round((loanAmount + totalInterest) * 100) / 100,
    amortization,
  };
}

// POST - Calculate mortgage and optionally save
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      homePrice,
      downPayment,
      interestRate,
      loanTermYears,
      propertyTax,
      homeInsurance,
      hoaFees,
      includePMI,
      propertyId,
      save = false,
    } = body;

    // Validate required fields
    if (!homePrice || homePrice <= 0) {
      return NextResponse.json({ error: 'Valid home price is required' }, { status: 400 });
    }
    if (downPayment < 0 || downPayment >= homePrice) {
      return NextResponse.json({ error: 'Down payment must be between 0 and home price' }, { status: 400 });
    }
    if (!interestRate || interestRate < 0 || interestRate > 30) {
      return NextResponse.json({ error: 'Interest rate must be between 0 and 30%' }, { status: 400 });
    }
    if (!loanTermYears || ![10, 15, 20, 25, 30].includes(loanTermYears)) {
      return NextResponse.json({ error: 'Loan term must be 10, 15, 20, 25, or 30 years' }, { status: 400 });
    }

    const result = calculateMortgage({
      homePrice,
      downPayment,
      interestRate,
      loanTermYears,
      propertyTax,
      homeInsurance,
      hoaFees,
      includePMI,
    });

    // Optionally save the calculation
    if (save) {
      const user = await getUser(req);
      if (user) {
        await prisma.mortgageCalculation.create({
          data: {
            userId: user.id,
            propertyId,
            homePrice,
            downPayment,
            downPaymentPct: result.downPaymentPct,
            loanAmount: result.loanAmount,
            interestRate,
            loanTermYears,
            monthlyPayment: result.monthlyPayment,
            principalInterest: result.principalInterest,
            propertyTax: result.propertyTax,
            homeInsurance: result.homeInsurance,
            hoaFees: result.hoaFees,
            pmi: result.pmi,
            totalPayment: result.totalCost,
            amortization: result.amortization as unknown as object[],
          },
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Mortgage calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate mortgage' }, { status: 500 });
  }
}

// GET - Affordability calculator
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthlyIncome = parseFloat(searchParams.get('monthlyIncome') || '0');
    const monthlyDebts = parseFloat(searchParams.get('monthlyDebts') || '0');
    const downPayment = parseFloat(searchParams.get('downPayment') || '0');
    const interestRate = parseFloat(searchParams.get('interestRate') || '12'); // Default 12% for Zambia
    const loanTermYears = parseInt(searchParams.get('loanTermYears') || '20');

    if (!monthlyIncome || monthlyIncome <= 0) {
      return NextResponse.json({ error: 'Valid monthly income is required' }, { status: 400 });
    }

    // Use 28% front-end ratio (housing cost to income)
    // Use 36% back-end ratio (total debt to income)
    const maxHousingPayment = monthlyIncome * 0.28;
    const maxTotalDebt = monthlyIncome * 0.36;
    const availableForHousing = Math.min(maxHousingPayment, maxTotalDebt - monthlyDebts);

    if (availableForHousing <= 0) {
      return NextResponse.json({
        canAfford: false,
        message: 'Current debts exceed recommended debt-to-income ratio',
        maxMonthlyPayment: 0,
        maxHomePrice: 0,
        recommendedHomePrice: 0,
      });
    }

    // Calculate max loan amount from monthly payment
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTermYears * 12;
    
    let maxLoanAmount: number;
    if (monthlyRate === 0) {
      maxLoanAmount = availableForHousing * numPayments;
    } else {
      maxLoanAmount = availableForHousing * (Math.pow(1 + monthlyRate, numPayments) - 1) /
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments));
    }

    const maxHomePrice = maxLoanAmount + downPayment;
    
    // Recommended is 80% of max (conservative)
    const recommendedHomePrice = maxHomePrice * 0.8;

    return NextResponse.json({
      canAfford: true,
      monthlyIncome,
      monthlyDebts,
      debtToIncomeRatio: Math.round((monthlyDebts / monthlyIncome) * 100),
      maxMonthlyPayment: Math.round(availableForHousing),
      maxLoanAmount: Math.round(maxLoanAmount),
      maxHomePrice: Math.round(maxHomePrice),
      recommendedHomePrice: Math.round(recommendedHomePrice),
      downPayment,
      interestRate,
      loanTermYears,
      assumptions: {
        frontEndRatio: '28%',
        backEndRatio: '36%',
        note: 'These calculations are estimates. Actual loan approval depends on credit history, employment, and lender requirements.',
      },
    });
  } catch (error) {
    console.error('Affordability calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate affordability' }, { status: 500 });
  }
}
