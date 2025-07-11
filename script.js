document.addEventListener('DOMContentLoaded', () => {
    const partyNameInput = document.getElementById('partyName');
    const quoteDateInput = document.getElementById('quoteDate');
    const expiryDateDisplay = document.getElementById('expiryDateDisplay');
    const itemsContainer = document.getElementById('itemsContainer');
    const addItemBtn = document.getElementById('addItemBtn');
    const discountPercentInput = document.getElementById('discountPercent');
    const generateQuoteBtn = document.getElementById('generateQuoteBtn');
    const skuDatalist = document.getElementById('skuOptions');

    // NEW: Elements for real-time summary display on input page
    const displaySubTotal = document.getElementById('displaySubTotal');
    const displayDiscountPercent = document.getElementById('displayDiscountPercent');
    const displayDiscountAmount = document.getElementById('displayDiscountAmount');
    const displayGSTAmount = document.getElementById('displayGSTAmount');
    const displayTotalAmount = document.getElementById('displayTotalAmount');

    // Populate datalist for SKUs
    masterComponents.forEach(component => {
        const option = document.createElement('option');
        option.value = component.sku;
        skuDatalist.appendChild(option);
    });

    // Set today's date as default
    const today = new Date();
    quoteDateInput.value = today.toISOString().split('T')[0];
    updateExpiryDate(); // Initial update

    // --- Event Listeners ---

    quoteDateInput.addEventListener('change', updateExpiryDate);
    addItemBtn.addEventListener('click', addItemRow);
    itemsContainer.addEventListener('input', handleItemInputChange);
    itemsContainer.addEventListener('click', handleRemoveItem);
    discountPercentInput.addEventListener('input', updateSummaryDisplays); // NEW: Update summary on discount change
    generateQuoteBtn.addEventListener('click', generateQuote);

    // --- Functions ---

    function updateExpiryDate() {
        const quoteDate = new Date(quoteDateInput.value);
        if (!isNaN(quoteDate)) {
            const expiryDate = new Date(quoteDate);
            expiryDate.setDate(quoteDate.getDate() + 30);
            expiryDateDisplay.textContent = ` (Expiry Date: ${expiryDate.toLocaleDateString('en-GB')})`;
        } else {
            expiryDateDisplay.textContent = '';
        }
    }

    function createItemRow() {
        const itemRow = document.createElement('div');
        itemRow.classList.add('item-row');
        itemRow.innerHTML = `
            <input type="text" class="sku-input" placeholder="SKU" list="skuOptions">
            <input type="number" class="qty-input" placeholder="Qty" min="1" value="1">
            <span class="description-display"></span>
            <span class="rate-display"></span>
            <span class="item-amount-display"></span>
            <button type="button" class="remove-item-btn">X</button>
        `;
        return itemRow;
    }

    function addItemRow() {
        itemsContainer.appendChild(createItemRow());
        updateSummaryDisplays(); // NEW: Update summary after adding a row
    }

    function handleItemInputChange(event) {
        const target = event.target;
        const itemRow = target.closest('.item-row');
        if (!itemRow) return;

        const skuInput = itemRow.querySelector('.sku-input');
        const qtyInput = itemRow.querySelector('.qty-input');
        const descriptionDisplay = itemRow.querySelector('.description-display');
        const rateDisplay = itemRow.querySelector('.rate-display');
        const itemAmountDisplay = itemRow.querySelector('.item-amount-display');

        let selectedComponent = null;

        // Handle SKU input change
        if (target === skuInput) {
            selectedComponent = masterComponents.find(c => c.sku.toLowerCase() === skuInput.value.toLowerCase());
            if (selectedComponent) {
                descriptionDisplay.textContent = selectedComponent.description;
                rateDisplay.textContent = selectedComponent.rate.toFixed(2);
            } else {
                descriptionDisplay.textContent = 'Invalid SKU';
                rateDisplay.textContent = '0.00';
            }
        } else if (target === qtyInput) {
            // Re-find component if quantity changes and SKU is already set
            selectedComponent = masterComponents.find(c => c.sku.toLowerCase() === skuInput.value.toLowerCase());
        }

        // Calculate item amount
        if (selectedComponent && !isNaN(qtyInput.value) && qtyInput.value > 0) {
            const amount = parseFloat(qtyInput.value) * selectedComponent.rate;
            itemAmountDisplay.textContent = amount.toFixed(2);
        } else {
            itemAmountDisplay.textContent = '0.00';
        }

        updateSummaryDisplays(); // NEW: Update summary after any item change
    }

    function handleRemoveItem(event) {
        if (event.target.classList.contains('remove-item-btn')) {
            const itemRow = event.target.closest('.item-row');
            if (itemRow && itemsContainer.children.length > 1) { // Ensure at least one row remains
                itemRow.remove();
            } else if (itemsContainer.children.length === 1) {
                // If only one row left, clear it instead of removing
                const skuInput = itemRow.querySelector('.sku-input');
                const qtyInput = itemRow.querySelector('.qty-input');
                const descriptionDisplay = itemRow.querySelector('.description-display');
                const rateDisplay = itemRow.querySelector('.rate-display');
                const itemAmountDisplay = itemRow.querySelector('.item-amount-display');

                skuInput.value = '';
                qtyInput.value = '1';
                descriptionDisplay.textContent = '';
                rateDisplay.textContent = '';
                itemAmountDisplay.textContent = '';
            }
            updateSummaryDisplays(); // NEW: Update summary after removing/clearing a row
        }
    }

    // NEW FUNCTION: Calculate and display summary on the input page
    function updateSummaryDisplays() {
        let currentSubTotal = 0;
        const currentDiscountPercent = parseFloat(discountPercentInput.value) || 0;

        const itemRows = itemsContainer.querySelectorAll('.item-row');
        itemRows.forEach(row => {
            const sku = row.querySelector('.sku-input').value;
            const qty = parseInt(row.querySelector('.qty-input').value);
            const component = masterComponents.find(c => c.sku.toLowerCase() === sku.toLowerCase());

            if (component && qty > 0) {
                currentSubTotal += qty * component.rate;
            }
        });

        const currentDiscountAmount = currentSubTotal * (currentDiscountPercent / 100);
        const currentAmountAfterDiscount = currentSubTotal - currentDiscountAmount;
        const currentGSTAmount = currentAmountAfterDiscount * 0.18;
        const currentTotalAmount = currentAmountAfterDiscount + currentGSTAmount;

        displaySubTotal.textContent = `Rs.${currentSubTotal.toFixed(2)}`;
        displayDiscountPercent.textContent = currentDiscountPercent;
        displayDiscountAmount.textContent = `Rs.${currentDiscountAmount.toFixed(2)}`;
        displayGSTAmount.textContent = `Rs.${currentGSTAmount.toFixed(2)}`;
        displayTotalAmount.textContent = `Rs.${currentTotalAmount.toFixed(2)}`;
    }

    // NEW FUNCTION: Generate random 4-digit suffix
    function generateRandomQuoteSuffix() {
        return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a number between 1000 and 9999
    }

    function generateQuote() {
        const partyName = partyNameInput.value.trim();
        const quoteDateStr = quoteDateInput.value;
        const discountPercent = parseFloat(discountPercentInput.value) || 0;

        if (!partyName || !quoteDateStr) {
            alert('Please fill in Party Name and Quote Date.');
            return;
        }

        const items = [];
        let subTotal = 0;

        const itemRows = itemsContainer.querySelectorAll('.item-row');
        itemRows.forEach((row, index) => {
            const sku = row.querySelector('.sku-input').value;
            const qty = parseInt(row.querySelector('.qty-input').value);
            const component = masterComponents.find(c => c.sku.toLowerCase() === sku.toLowerCase());

            if (component && qty > 0) {
                const itemAmount = qty * component.rate;
                subTotal += itemAmount;
                items.push({
                    id: index + 1,
                    description: component.description,
                    qty: qty,
                    rate: component.rate,
                    amount: itemAmount
                });
            }
        });

        if (items.length === 0) {
            alert('Please add at least one valid item to the quote.');
            return;
        }

        const discountAmount = subTotal * (discountPercent / 100);
        const amountAfterDiscount = subTotal - discountAmount;
        const gstAmount = amountAfterDiscount * 0.18; // 18% GST
        const totalAmount = amountAfterDiscount + gstAmount;

        const quoteDate = new Date(quoteDateStr);
        const expiryDate = new Date(quoteDate);
        expiryDate.setDate(quoteDate.getDate() + 30);

        const formattedQuoteDate = quoteDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const formattedExpiryDate = expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const randomQuoteSuffix = generateRandomQuoteSuffix(); // NEW: Get random suffix
        const finalQuoteNumber = `NIIPL/24-25/QT${randomQuoteSuffix}`; // NEW: Construct final quote number

        // --- Construct the HTML for the quote ---
        let itemsHtml = '';
        items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.description}</td>
                    <td class="text-right">${item.qty}</td>
                    <td class="text-right">${item.rate.toFixed(2)}</td>
                    <td class="text-right">0.00</td> <td class="text-right">${item.amount.toFixed(2)}</td>
                </tr>
            `;
        });

        // NEW: Embed the critical CSS directly into the HTML to ensure immediate styling for print
        const embeddedCss = `
            .quote-page {
                font-family: 'Arial', sans-serif;
                font-size: 10pt;
                color: #333;
                width: 210mm; /* A4 width */
                min-height: 297mm; /* A4 height */
                margin: 0 auto;
                padding: 20mm;
                box-sizing: border-box;
                background: #fff;
                box-shadow: 0 0 5px rgba(0,0,0,0.1);
            }

            .quote-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
            }

            .quote-header .logo {
                width: 150px; /* Adjust as needed */
                height: auto;
                margin-right: 20px;
            }

            .quote-header .title-block {
                text-align: right;
            }

            .quote-header .title-block h1 {
                font-size: 28pt;
                margin: 0;
                color: #333;
                text-align: right;
            }

            .quote-header .title-block .quote-num {
                font-size: 12pt;
                color: #666;
                margin-top: 5px;
            }

            .address-block {
                margin-bottom: 20px;
                line-height: 1.5;
                font-size: 10pt;
            }

            .address-block strong {
                font-size: 11pt;
                color: #000;
            }

            .quote-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 30px;
                border-top: 1px solid #eee;
                padding-top: 15px;
            }

            .quote-details div {
                display: flex;
                justify-content: space-between;
            }

            .quote-details span:first-child {
                font-weight: bold;
                color: #555;
            }

            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                font-size: 9.5pt;
            }

            .items-table th, .items-table td {
                border: 1px solid #ddd;
                padding: 8px 10px;
                text-align: left;
            }

            .items-table th {
                background-color: #f2f2f2;
                font-weight: bold;
                color: #555;
            }

            .items-table .text-right {
                text-align: right;
            }

            .items-table td:nth-child(1) { width: 3%; } /* # */
            .items-table td:nth-child(2) { width: 45%; } /* Item & Description */
            .items-table td:nth-child(3) { width: 8%; text-align: right; } /* Qty */
            .items-table td:nth-child(4) { width: 15%; text-align: right; } /* Rate */
            .items-table td:nth-child(5) { width: 12%; text-align: right; } /* Discount (value) - not percentage */
            .items-table td:nth-child(6) { width: 15%; text-align: right; } /* Amount */


            .summary-section {
                width: 300px; /* Fixed width for summary block */
                float: right;
                margin-bottom: 30px;
                border: 1px solid #ddd;
                padding: 10px;
            }

            .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                border-bottom: 1px dashed #eee;
            }

            .summary-row:last-child {
                border-bottom: none;
                font-weight: bold;
                font-size: 12pt;
                background-color: #f0f0f0;
                padding: 10px 0;
            }

            .summary-row .label {
                font-weight: bold;
            }

            .summary-row .value {
                text-align: right;
            }

            .terms-conditions {
                clear: both; /* Clear float from summary section */
                margin-top: 20px;
                border-top: 1px solid #eee;
                padding-top: 20px;
                font-size: 9pt;
                line-height: 1.6;
            }

            .terms-conditions h3 {
                font-size: 11pt;
                margin-bottom: 10px;
                color: #555;
            }
            /* Ensure images load for print */
            img {
                max-width: 100%;
                height: auto;
            }

            /* Styles for print media - to ensure clean PDF output */
            @media print {
                body {
                    margin: 0;
                    padding: 0;
                    background: none;
                    -webkit-print-color-adjust: exact; /* For better background/color printing */
                }
                .quote-page {
                    box-shadow: none;
                    border-radius: 0;
                    margin: 0;
                    padding: 0;
                }
            }
        `;


        const quoteHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Nexrise India Quote - ${partyName}</title>
                <style>${embeddedCss}</style> </head>
            <body>
                <div class="quote-page">
                    <div class="quote-header">
                        <img src="https://nexriseindia.in/wp-content/uploads/2022/12/logo-dark-small.png" alt="Nexrise India Infra Logo" class="logo">
                        <div class="title-block">
                            <h1>QUOTE</h1>
                            <div class="quote-num">#${finalQuoteNumber}</div> </div>
                    </div>

                    <div class="address-block">
                        <p><strong>Nexrise India Infra Pvt. Ltd</strong><br>
                        Jaipur, Rajasthan 302012<br>
                        India</p>

                        <p><strong>Bill To:</strong><br>
                        ${partyName}</p>
                    </div>

                    <div class="quote-details">
                        <div><span>Quote Date:</span><span>${formattedQuoteDate}</span></div>
                        <div><span>Expiry Date:</span><span>${formattedExpiryDate}</span></div>
                        <div><span>Reference#:</span><span>(Not Applicable)</span></div>
                    </div>

                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Item & Description</th>
                                <th class="text-right">Qty</th>
                                <th class="text-right">Rate</th>
                                <th class="text-right">Discount</th>
                                <th class="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div class="summary-section">
                        <div class="summary-row">
                            <span class="label">Sub Total</span>
                            <span class="value">Rs.${subTotal.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Discount (${discountPercent}%)</span>
                            <span class="value">Rs.${discountAmount.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">GST (18%)</span>
                            <span class="value">Rs.${gstAmount.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="label">Total</span>
                            <span class="value">Rs.${totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="terms-conditions">
                        <h3>Terms & Conditions:</h3>
                        <ul>
                            <li>Kindly issue a formal Work/Purchase Order in the name of NEXRISE INDIA INFRA PVT LTD<br>
                            Office 310-311, 3rd Floor, Prime Tower, Jhotwara Industrial Area, Jaipur, Rajasthan, India - 302012<br>
                            GSTIN - 08AAICN3977E1Z5With the acceptance of this quotation</li>
                            <li>Loading & Unloading/Movement and shifting of material at the site is in your scope only.</li>
                            <li>Transportation charges extra mentioned in quote.(delivery from Jaipur)</li>
                            <li>Payment terms – 100 %advance along with purchase order.</li>
                            <li>Taxes extra on the above price according to the prevailing GST Module (@18%).</li>
                            <li>Delivery of the material in 4-5 days against the payment and purchase order.</li>
                        </ul>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Open in a new window/tab and trigger print
        const newWindow = window.open();
        newWindow.document.write(quoteHtml);
        // Wait for the content to be parsed (DOMContentLoaded) or loaded (onload)
        // For embedded CSS, DOMContentLoaded is usually sufficient
        newWindow.document.addEventListener('DOMContentLoaded', () => {
             newWindow.focus(); // Focus on the new window
             newWindow.print(); // Trigger the browser's print dialog
        });
        // Alternatively, for more complex scenarios with external resources, you might wait for 'onload':
        // newWindow.onload = () => {
        //     newWindow.focus();
        //     newWindow.print();
        // };
        newWindow.document.close(); // Important for some browsers to finish loading the content
    }

    // Initial item row and summary update
    addItemRow();
    updateSummaryDisplays();
});