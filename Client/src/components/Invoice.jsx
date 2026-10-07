import { useAuth } from "../context/AuthContext";

const money = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Invoice = ({ bill, printRef }) => {
  const { user } = useAuth();
  const date = new Date(bill.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      ref={printRef}
      className="bg-white text-gray-900 text-sm mx-auto w-full max-w-340px p-4"
    >
      <div className="text-center border-b border-dashed pb-3">
        <h1 className="text-lg font-bold uppercase">{user.shopName}</h1>
        <p className="text-xs text-gray-600">Tax Invoice</p>
      </div>

      <div className="flex justify-between py-2 text-xs border-b border-dashed">
        <span>Bill #{bill.billNumber}</span>
        <span>{date}</span>
      </div>
      {bill.customerName && (
      <p className="text-xs py-1 border-b border-dashed">Customer: {bill.customerName}</p>
       )}

      <table className="w-full my-2">
        <thead>
          <tr className="text-left text-xs border-b">
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Rate</th>
            <th className="py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((i, index) => (
            <tr key={index} className="align-top">
              <td className="py-1 pr-1">{i.name}</td>
              <td className="py-1 text-center">{i.qty}</td>
              <td className="py-1 text-right">{i.price}</td>
              <td className="py-1 text-right">{(i.price * i.qty).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed pt-2 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{money(bill.subtotal)}</span>
        </div>
        {bill.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{money(bill.discount)}</span>
          </div>
        )}
        {bill.gstRate > 0 && (
          <div className="flex justify-between">
            <span>GST ({bill.gstRate}%)</span>
            <span>{money(bill.gst)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold border-t pt-1">
          <span>TOTAL</span>
          <span>{money(bill.total)}</span>
        </div>
        <p className="text-xs text-gray-600 capitalize">
        {bill.paymentMode === "credit" ? "On credit (udhaar)" : `Paid by: ${bill.paymentMode}`}
        </p>
      </div>

      <p className="text-center text-xs mt-4 border-t border-dashed pt-3">
        Thank you! Visit again.
      </p>
    </div>
  );
};

export default Invoice;