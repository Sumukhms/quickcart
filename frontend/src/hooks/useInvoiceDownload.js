import { useState, useCallback } from "react";
import { invoiceAPI } from "../api/api";

/**
 * useInvoiceDownload — triggers a PDF download for a given orderId.
 *
 * Usage:
 *   const { download, downloading } = useInvoiceDownload();
 *   <button onClick={() => download(order._id)} disabled={downloading}>
 *     Download Invoice
 *   </button>
 */
export function useInvoiceDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const download = useCallback(async (orderId) => {
    setDownloading(true);
    setError(null);
    try {
      const response = await invoiceAPI.download(orderId);

      // ✅ Create a temporary object URL from the blob
      const blob = new Blob([response.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(blob);

      // ✅ Programmatically click a hidden <a> to trigger the download
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `QuickCart-Invoice-${orderId.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // ✅ Revoke after a tick to free memory
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to download invoice";
      setError(msg);
      console.error("[Invoice] download error:", e.message);
    } finally {
      setDownloading(false);
    }
  }, []);

  return { download, downloading, error };
}
