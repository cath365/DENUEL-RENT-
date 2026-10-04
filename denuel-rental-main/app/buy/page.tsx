import Header from '../../components/Header';
import PropertySearchMarketplace from '../../components/PropertySearchMarketplace';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PropertySearchMarketplace
        mode="SALE"
        title="Property for sale in Zambia"
        description="Browse homes, land and investment property for sale across Zambia with clear pricing and location information."
      />
    </div>
  );
}
