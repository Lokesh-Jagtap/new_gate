const helperFunction = require('../helper_functions/helperFunction')

// Data transformation functions
function transformCustomerOutstanding(sapData, query) {
  // Transform SAP response to our expected format
  const items = sapData.d?.results || sapData.results || [];
  // console.log('This is transform Outstanding---->', items[0]);
  return items.map(item => ({
    customer_id: item.Kunnr,
    customer: item.CustomerName || item.Customer || item.Name1,
    amount: helperFunction.formatCurrency(item.OutstandingAmount || item.Amount || item.Dmbtr),
    due_date: helperFunction.formatDate((item.Budat || item.BUDAT || '').includes('/Date')
        ? helperFunction.parseSAPDate(item.Budat || item.BUDAT): (item.Budat || item.BUDAT)),
    overdue_days: helperFunction.calculateOverdueDays((item.Budat || item.BUDAT || '').includes('/Date')
        ? helperFunction.parseSAPDate(item.Budat || item.BUDAT): (item.Budat || item.BUDAT)),
    documentNumber: item.Belnr || item.belnr,
    companyCode: item.CompanyCode || item.Bukrs

  }))
}

//total outstanding
function groupOutstandingByCompany(sapData) {
  const items = sapData.d?.results || sapData.results || [];

  const companySummary = {};

  items.forEach(item => {
    const customer = item.customer || item.Name1;
    const Customer_Id = item.CompanyCode || item.Kunnr;
    const rawAmount = item.OutstandingAmount || item.Amount || item.Dmbtr;
    const amount = parseFloat(rawAmount);
    // const dueDate = helperFunction.formatDate(item.NetDueDate || item.DueDate || helperFunction.parseSAPDate(item.Budat));
    const dueDate= helperFunction.formatDate((item.Budat || item.BUDAT || '').includes('/Date')
        ? helperFunction.parseSAPDate(item.Budat || item.BUDAT): (item.Budat || item.BUDAT));
    const isOverdue = helperFunction.calculateOverdueDays(dueDate) > 0;

    if (!companySummary[customer]) {
      companySummary[customer] = {
        customer,
        Customer_Id,
        totalAmount: 0,
        overdueCount: 0
      };
    }

    companySummary[customer].totalAmount += amount;
    if (isOverdue) {
      companySummary[customer].overdueCount += 1;
    }
  });

  return Object.values(companySummary)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .map(summary => ({
      customer: summary.customer,
      Customer_Id: summary.Customer_Id,
      totalAmount: helperFunction.formatCurrency(summary.totalAmount),
      total_overdues: summary.overdueCount
    }))
}

//sales order block
function transformSalesOrderBlocked(sapData) {
  const items = sapData.d?.results || sapData.results || [];
  // console.log();
  return items
    // .filter(item => item.Cmgst == 'B') // Only blocked orders
    // .filter(item => item.OverallDeliveryBlockStatus || item.F1aksk)
    .filter(item => item.Cmgst || item.Faksk)
    .map(item => ({
      order_id: item.SalesOrder || item.Vbeln,
      customer: item.SoldToPartyName || item.CustomerName || item.Vkorg,
      amount: helperFunction.formatCurrency(item.NetAmount || item.TotalNetAmount || item.Netwr),
      block_reason: helperFunction.getBlockReason(item),
      created_date: helperFunction.formatDate(item.SalesOrderDate || item.CreationDate || helperFunction.parseSAPDate(item.Erdat)),
      overAllBlockStatus: item.Cmgst,
      deliveryBlock: item.Lifsk,
      billingBlock: item.Faksk
    })).sort((a, b) => parseFloat(b.amount.replace(/[₹,]/g, '')) - parseFloat(a.amount.replace(/[₹,]/g, '')));
}

//supplier outstanding
function transformSupplierOutstanding(sapData) {
  const items = (sapData?.d && sapData.d.results) ? sapData.d.results : [];
  // console.log('Backend Data------>', items[0]);

  return items
    .map(item => {
      const rawDate = item.NetDueDate || helperFunction.parseSAPDate(item.ZFBDT || item.Zfbdt || '');
      const rawAmount = item.OutstandingAmount || item.Amount || item.Dmbtr;

      return {
        supplier_id: item.SupplierId || item.Lifnr,
        supplier: item.SupplierName || item.Supplier || item.Name1,
        amount: helperFunction.formatCurrency(rawAmount || 0),
        due_date: helperFunction.formatDate(rawDate),
        overdue_days: helperFunction.calculateOverdueDays(rawDate),
        invoice_no: item.Belnr || item.BELNR,
        companyCode: item.Bukrs || item.BUKRS,
        paymentTerms: item.Zterm || item.ZTERM
      };
    })
    .sort((a, b) => {
      const amtA = parseFloat((a.amount || '0').replace(/[₹,]/g, ''));
      const amtB = parseFloat((b.amount || '0').replace(/[₹,]/g, ''));
      return amtB - amtA;
    });
}


//purchase order status
function transformPurchaseOrderStatus(sapData) {
  const items = sapData.d?.results || sapData.results || [];

  return items.map(item => ({
    purchasing_doc: item.PurchaseDoc || item.Ebeln,
    supplier_id: item.SupplierId || item.Lifnr,
    order_type: item.OrderType || item.Bsart,
    order_date: helperFunction.formatDate(item.OrderDate || helperFunction.parseSAPDate(item.Bedat)),
    plant: item.Plant || item.Werks,
    material: item.Material || item.Matnr,
    quantity: item.Quantity || item.Menge,
    status: item.Status || item.OpenFlg || item.open_flg
  })).sort((a, b) => parseFloat(b.quantity) - parseFloat(a.quantity));
}

//Purchase Order overdue
function transformPurchaseOrderOverdue(sapData) {
  const items = sapData.d?.results || sapData.results || [];
  // console.log('Purchase Order Overdue-------------->', items[0]);
  return items.map(item => ({
    purchasing_doc: item.Ebeln,
    item: item.Ebelp,
    schedule_line: item.Etenr,
    delivery_date: helperFunction.formatDate(helperFunction.parseSAPDate(item.Eindt)),
    overdue_days: helperFunction.calculateOverdueDays(helperFunction.formatDate(helperFunction.parseSAPDate(item.Eindt))),
    scheduled_qty: item.Menge,
    recieved: item.Wemng,
    pending: item.Menge - item.Wemng
  })).sort((a, b) => parseFloat(b.scheduled_qty) - parseFloat(a.scheduled_qty))
}

//Pending Inbound Deliveries
function transformInBoundDelivery(sapData) {
  const items = sapData.d?.results || sapData.results || [];
  return items.map(item => ({
    SD_document: item.Vbeln,
    customer_id: item.Kunnr,
    delivery_type: item.Lfart,
    delivery_status: item.Wbstk
  }))
}

// Blocked Invoices
function transformblockedInvoice(sapData) {
  const items = sapData.d?.results || sapData.results || [];
  return items.map(item => ({
    invoice_no: item.Belnr,
    material: item.Matnr,
    payment_block: item.Zlspr,
    financial_year: item.Gjahr
  }))
}



//View Roles
function transformRoles(sapData) {
  const items = sapData.d?.results || sapData.results || [];
  return items.map(item => ({
    role: item.Zrole,
    description: item.Zdesc,
    start_date: helperFunction.formatToISODate(item.ZstartDate)
  }))
}

function transformLogin(sapData) {
  // const item = sapData.d?.results || sapData.d.results || [];
  const item = sapData;
  // console.log('This is last login information', sapData);
  return {
    success: {
      message: "Your last login information:",
      lastLogin: helperFunction.formatDate(helperFunction.parseSAPDate(item.d.ChangeDat)),
      failedAttempts: 0,
      accountStatus: "Active"
    },
    error: "Unable to retrieve login information. Please contact IT support."
  }
}

module.exports = {
  transformCustomerOutstanding,
  transformSupplierOutstanding,
  transformInBoundDelivery,
  transformPurchaseOrderOverdue,
  transformPurchaseOrderStatus,
  groupOutstandingByCompany,
  transformblockedInvoice,
  transformSalesOrderBlocked,
  transformRoles,
  transformLogin
}