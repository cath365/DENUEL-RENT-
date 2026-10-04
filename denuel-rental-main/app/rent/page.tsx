import Header from '../../components/Header';
import PropertySearchMarketplace from '../../components/PropertySearchMarketplace';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PropertySearchMarketplace
        mode="RENT"
        title="Properties for rent in Zambia"
        description="Browse houses, apartments and rooms for rent across Zambia. Filter by location, price, bedrooms and practical living needs."
      />
    </div>
  );
}
