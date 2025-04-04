window.onload = function() { //ensure that page elements are loaded
    "use strict"; //"enters strict mode"

    var TOTAL_ROWS = 10001,    
        ROW_HEIGHT = 40,      
        VISIBLE_ROWS = 20,     
        BUFFER = 5; // Extra rows rendered above/below viewport
    
    //    //Getting DOM elements from HTML
    var container = document.getElementById("table-container"),
        tableBody = document.getElementById("table-body"),
        spacer = document.getElementById("spacer"),
        resetButton = document.getElementById("reset-button"),

        state = JSON.parse(localStorage.getItem("radioState")) || {},// Load saved state or use empty object
        scrollInterval = null;//initialization

    if (!container || !tableBody || !spacer) return;// Exit if required elements are not found

    spacer.style.height = (TOTAL_ROWS * ROW_HEIGHT) + "px";// Initialize virtual scroll space
    
    function createRow(index) { 
        var row = document.createElement("tr"); // Create a new table row  <tr> element
        var selected = state[index] || "1"; //retrieves previous state or sets to 1
        row.style.position = "absolute";// Set absolute positioning for proper row placement
        row.style.top = (index * ROW_HEIGHT) + "px";// Position row vertically based on its index
        
        row.innerHTML = // Build row with label and three radio buttons (selected marked)
            "<td>Row " + index + "</td>" +
            "<td><input type='radio' name='row" + index + "' value='1'" + (selected === "1" ? " checked" : "") + "></td>" +
            "<td><input type='radio' name='row" + index + "' value='2'" + (selected === "2" ? " checked" : "") + "></td>" +
            "<td><input type='radio' name='row" + index + "' value='3'" + (selected === "3" ? " checked" : "") + "></td>";
        return row;
    }
    
    function renderRows() {
        var scrollTop = container.scrollTop; //how far the container has been scrolled
        var startIndex = Math.max(1, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);// Calculate start index
        var endIndex = Math.min(TOTAL_ROWS, startIndex + VISIBLE_ROWS + BUFFER);// Calculate end index
        
        while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);//clear and rebuild rows
        var fragment = document.createDocumentFragment();// Create a temporary container for new rows
        for (var i = startIndex; i < endIndex; i++) {
            fragment.appendChild(createRow(i));// Add each row to the container
        }
        tableBody.appendChild(fragment);
    }

    function startContinuousScroll(direction) { //smooth scrolling
        if (scrollInterval) return;
        
        function scroll() {
            if (!scrollInterval) return;

            var currentScroll = container.scrollTop;// Get the current scroll position
            var maxScroll = (TOTAL_ROWS * ROW_HEIGHT) - container.clientHeight;//maximum scrollable distanc
            
            container.scrollTop = currentScroll;// Update the container's scroll position to the new value
            scrollInterval = requestAnimationFrame(scroll);// Schedule the next frame to continue smooth scrolling
        }
        
        scrollInterval = requestAnimationFrame(scroll);
    }
    container.onmousedown = function(e) {// When the mouse is pressed on the container, run this function using event details 'e'
        var rect = container.getBoundingClientRect(); // Get container's position and size
        var scrollbarWidth = container.offsetWidth - container.clientWidth;// Calculate scrollbar width
        
        if (e.clientX <= rect.right - scrollbarWidth) return;        // Ignore clicks not on scrollbar

        var arrowHeight = 17; // Standard scrollbar arrow height
        
        // Handle scroll arrow clicks
        if (e.clientY <= rect.top + arrowHeight) {
            startContinuousScroll('up');
            return;
        }
        if (e.clientY >= rect.bottom - arrowHeight) {
            startContinuousScroll('down');
            return;
        }
        
        // Handle scrollbar track clicks
        var trackHeight = container.clientHeight - (2 * arrowHeight);
        var scrollRatio = (e.clientY - rect.top - arrowHeight) / trackHeight;
        var newScrollTop = scrollRatio * (TOTAL_ROWS * ROW_HEIGHT - container.clientHeight);
        
        container.scrollTop = newScrollTop;
        renderRows();
    };

    // Persist radio selection state
    tableBody.onchange = function(e) {
        if (e.target.type === "radio") {
            var index = e.target.name.replace("row", "");
            state[index] = e.target.value;
            localStorage.setItem("radioState", JSON.stringify(state));
        }
    };

    // Reset all selections to default
    resetButton.onclick = function() {
        localStorage.removeItem("radioState");
        state = {};
        renderRows();
    };

    // Update view on scroll
    container.onscroll = function() {
        requestAnimationFrame(renderRows);
    };
    renderRows(); // Render the initial set of visible rows (plus buffer) on page load
};