import { XMLParser } from "fast-xml-parser";

export const extractSAPMessage = (xmlString) => {
  if (!xmlString) return "Unknown SAP error";
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
      textNodeName: "text",
      trimValues: true,
    });
    const jsonObj = parser.parse(xmlString);
    return (
      jsonObj?.error?.innererror?.errordetails?.errordetail?.message ||
      jsonObj?.error?.message?.text ||
      "SAP error occurred"
    );
  } catch {
    return "Failed to parse SAP error message";
  }
};

export const extractMessageFromXML = (xmlString) => {
  if (!xmlString) return null;
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
      textNodeName: "text",
      trimValues: true,
    });
    const jsonObj = parser.parse(xmlString);
    return (
      jsonObj?.entry?.content?.properties?.Message ||
      jsonObj?.entry?.["m:properties"]?.["d:Message"] ||
      null
    );
  } catch {
    return null;
  }
};

export const buildODataFilter = (formData) => {
  const filters = [];
  if (formData.dateFromDate && formData.dateToDate)
    filters.push(
      `(SysDate ge datetime'${formData.dateFromDate}T00:00:00' and SysDate le datetime'${formData.dateToDate}T23:59:59')`
    );
  else if (formData.dateFromDate)
    filters.push(`(SysDate eq datetime'${formData.dateFromDate}T00:00:00')`);
  if (formData.poNumberFrom && formData.poNumberTo)
    filters.push(
      formData.poNumberFrom === formData.poNumberTo
        ? `(Ebeln eq '${formData.poNumberFrom}')`
        : `(Ebeln ge '${formData.poNumberFrom}' and Ebeln le '${formData.poNumberTo}')`
    );
  else if (formData.poNumberFrom)
    filters.push(`(Ebeln eq '${formData.poNumberFrom}')`);
  if (formData.supplierFromCode) {
    const supplierFrom = formData.supplierFromCode.padStart(10, "0");
    const supplierTo = (formData.supplierToCode || supplierFrom).padStart(
      10,
      "0"
    );
    filters.push(
      supplierFrom === supplierTo
        ? `(Lifnr eq '${supplierFrom}')`
        : `(Lifnr ge '${supplierFrom}' and Lifnr le '${supplierTo}')`
    );
  }
  if (formData.supplierInvoiceFrom) {
    const invFrom = formData.supplierInvoiceFrom;
    const invTo = formData.supplierInvoiceTo || invFrom;
    filters.push(
      invFrom === invTo
        ? `(InvNo eq '${invFrom}')`
        : `(InvNo ge '${invFrom}' and InvNo le '${invTo}')`
    );
  }
  if (formData.plant)
    filters.push(`(Werks eq '${formData.plant.padStart(4, "0")}')`);
  return filters.length > 0 ? filters.join(" and ") : "";
};
