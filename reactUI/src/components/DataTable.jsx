import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DataTable = ({ data, columnMapping }) => {
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ column: null, order: null });

  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  // Helper function to check if a column contains dates
  const isDateColumn = (column) => {
    return column.toLowerCase().includes('date') || column.toLowerCase().includes('sysdate');
  };

  // Helper function to parse DD-MM-YYYY format to Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return null;
  };

  // Helper function to format date as DD/MM/YYYY for display
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to check if two dates are the same day
  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Apply filters
  const filteredData = data.filter((row) =>
    Object.entries(filters).every(([col, value]) => {
      if (!value) return true;
      
      if (isDateColumn(col)) {
        // For date columns, compare the actual dates
        const rowDate = parseDate(row[col]);
        const filterDate = value; // This will be a Date object from DatePicker
        return isSameDay(rowDate, filterDate);
      } else {
        // For non-date columns, use text filtering
        return row[col]?.toString().toLowerCase().includes(value.toLowerCase());
      }
    })
  );

  // Apply sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.column || !sortConfig.order) return 0;

    const col = sortConfig.column;
    const valA = a[col];
    const valB = b[col];

    // Date sorting for date columns
    if (isDateColumn(col)) {
      const dateA = parseDate(valA);
      const dateB = parseDate(valB);
      if (!dateA && !dateB) return 0;
      if (!dateA) return sortConfig.order === "asc" ? -1 : 1;
      if (!dateB) return sortConfig.order === "asc" ? 1 : -1;
      
      return sortConfig.order === "asc" 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }

    // Numeric sort if both values are numbers, otherwise string sort
    const isNumeric = !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB));

    if (isNumeric) {
      return sortConfig.order === "asc"
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    } else {
      return sortConfig.order === "asc"
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    }
  });

  // Handle sort when column header is clicked
  const handleSort = (col) => {
    setSortConfig((prev) => {
      if (prev.column === col) {
        // Toggle order
        return {
          column: col,
          order: prev.order === "asc" ? "desc" : "asc",
        };
      }
      // Default to ascending on first click
      return { column: col, order: "asc" };
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
  };

  // Handle filter change for different column types
  const handleFilterChange = (col, value) => {
    setFilters({ ...filters, [col]: value });
  };

  const formatMenge = (val) => {
    if (val == null) return "";
    let str = String(val).trim();

    // If starts with ".", add leading 0
    if (str.startsWith(".")) str = "0" + str;

    // If it's an integer-like value, strip leading zeros
    if (/^\d+$/.test(str)) {
      str = str.replace(/^0+/, "") || "0";
    }

    return str;
  };

  return (
    <div className="card mt-4 shadow-sm">
      <div className="card-body">
        <h3 className="h6 fw-semibold mb-3">Report Results</h3>

        {/* Controls */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-light">
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    style={{
                      minWidth: index === 0 ? "220px" : "150px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    {columnMapping[col] || col}
                    {sortConfig.column === col && (
                      <span className="ms-1">
                        {sortConfig.order === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
              <tr>
                {columns.map((col) => (
                  <th key={col}>
                    {isDateColumn(col) ? (
                      <DatePicker
                        selected={filters[col] || null}
                        onChange={(date) => handleFilterChange(col, date)}
                        placeholderText="Filter"
                        dateFormat="dd/MM/yyyy"
                        className="form-control form-control-sm"
                        isClearable
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        maxDate={new Date()}
                      />
                    ) : (
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Filter"
                        value={filters[col] || ""}
                        onChange={(e) => handleFilterChange(col, e.target.value)}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col, colIndex) => {
                    let displayValue = row[col];
                    
                    // Format Menge column
                    if (col === "Menge") {
                      displayValue = formatMenge(row[col]);
                    }
                    // Format date columns to DD/MM/YYYY for display
                    else if (isDateColumn(col) && row[col]) {
                      const parsedDate = parseDate(row[col]);
                      if (parsedDate) {
                        displayValue = formatDateForDisplay(parsedDate);
                      }
                    }

                    return (
                      <td
                        key={colIndex}
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={displayValue}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;