import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import Invoice from "./Invoice";

const InvoiceModal = ({ bill, onClose, closeLabel = "Close" }) => {
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bill-${bill.billNumber}`, // default PDF file name
    pageStyle: "@page { margin: 6mm; }",
  });

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow w-full max-w-md max-h-[92vh] flex flex-col">
        <div className="p-4 border-b text-center">
          <p className="text-3xl">✅</p>
          <h2 className="text-lg font-bold text-green-700">
            Bill #{bill.billNumber}
          </h2>
        </div>

        <div className="overflow-y-auto p-2 bg-gray-50 flex-1">
          <Invoice bill={bill} printRef={printRef} />
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            🖨 Print / Save PDF
          </button>
          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;