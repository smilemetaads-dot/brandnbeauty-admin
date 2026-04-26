export default function RealSuppliersPage() {
  const supplier = {
    name: "Some By Mi",
    status: "Active",
    totalProducts: 12,
    totalPurchases: "৳1,24,000",
    lastOrder: "2 days ago",
    contact: "+8801XXXXXXXXX",
  };

  const purchaseHistory = [
    {
      date: "Mar 18",
      product: "Acne Facewash",
      qty: 40,
      cost: "৳16,800",
      status: "Received",
    },
    {
      date: "Mar 15",
      product: "Tea Tree Gel",
      qty: 20,
      cost: "৳7,200",
      status: "Partial",
    },
    {
      date: "Mar 10",
      product: "Serum",
      qty: 25,
      cost: "৳12,500",
      status: "Received",
    },
  ];

  const products = [
    { name: "Acne Facewash", stock: 124, status: "Good" },
    { name: "Tea Tree Gel", stock: 18, status: "Low" },
    { name: "Serum", stock: 65, status: "Good" },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-stone-50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Admin / Suppliers</div>
          <h1 className="text-3xl font-bold">{supplier.name}</h1>
        </div>
        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            supplier.status === "Active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-stone-100 text-slate-700"
          }`}
        >
          {supplier.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5">
          Total Products
          <br />
          <b>{supplier.totalProducts}</b>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          Total Purchase
          <br />
          <b>{supplier.totalPurchases}</b>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          Last Order
          <br />
          <b>{supplier.lastOrder}</b>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          Contact
          <br />
          <b>{supplier.contact}</b>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5">
          Profit Generated
          <br />
          <b className="text-emerald-600">৳48,500</b>
          <div className="mt-1 text-xs text-slate-500">
            Total margin from this supplier
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          Return Rate
          <br />
          <b className="text-rose-500">12%</b>
          <div className="mt-1 text-xs text-slate-500">
            High return on acne products
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          Pending Purchases
          <br />
          <b className="text-amber-600">3 Orders</b>
          <div className="mt-1 text-xs text-slate-500">
            Need to receive stock
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          Payment Due
          <br />
          <b className="text-sky-600">৳22,000</b>
          <div className="mt-1 text-xs text-slate-500">
            Unpaid supplier balance
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <h2 className="mb-4 text-xl font-bold">Purchase History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3">Date</th>
                <th className="py-3">Product</th>
                <th className="py-3">Qty</th>
                <th className="py-3">Cost</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchaseHistory.map((purchase) => (
                <tr key={`${purchase.date}-${purchase.product}`} className="border-t">
                  <td className="py-3">{purchase.date}</td>
                  <td className="py-3">{purchase.product}</td>
                  <td className="py-3">{purchase.qty}</td>
                  <td className="py-3">{purchase.cost}</td>
                  <td className="py-3">{purchase.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <h2 className="mb-4 text-xl font-bold">Supplier Products</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <div key={product.name} className="rounded-2xl bg-stone-50 p-4">
              <div className="font-semibold">{product.name}</div>
              <div className="text-sm">Stock: {product.stock}</div>
              <div
                className={`mt-1 text-xs ${
                  product.status === "Low" ? "text-red-500" : "text-green-600"
                }`}
              >
                {product.status} stock
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <h2 className="mb-4 text-xl font-bold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl bg-[#5E7F85] px-4 py-2 text-white">
            Create Purchase
          </button>
          <button className="rounded-xl border px-4 py-2">Edit Supplier</button>
          <button className="rounded-xl border px-4 py-2">View Analytics</button>
        </div>
      </div>
    </div>
  );
}
