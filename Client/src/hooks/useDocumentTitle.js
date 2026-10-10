import { useEffect } from "react";

const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title
      ? `${title} | Dukan Saathi`
      : "Dukan Saathi | Inventory and Billing for Small Shops";
  }, [title]);
};

export default useDocumentTitle;