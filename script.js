window.onload = function() {
    "use strict";
    
    // Configuration constants
    var TOTAL_ROWS = 10001,    
        ROW_HEIGHT = 40,        // Height of each row in pixels
        VISIBLE_ROWS = 20,      // Number of rows visible in viewport
        BUFFER = 5,             // Extra rows rendered above/below viewport
        SCROLL_SPEED = 2;       // Pixels per frame for smooth scrolling
    
    // DOM elements and state
    var container = document.getElementById("table-container"),
        tableBody = document.getElementById("table-body"),
        spacer = document.getElementById("spacer"),
        resetButton = document.getElementById("reset-button"),
        isIE = !!window.document.documentMode,
        state = JSON.parse(localStorage.getItem("radioState")) || {},
        scrollInterval = null;

    // Exit if required elements are not found
    if (!container || !tableBody || !spacer) return;
    
    // Initialize virtual scroll space
    spacer.style.height = (TOTAL_ROWS * ROW_HEIGHT) + "px";
    
    /**
     * Creates a table row with radio buttons
     * @param {number} index - Row index (1-based)
     * @returns {HTMLElement} Table row element
     */
    function createRow(index) {
        var row = document.createElement("tr");
        var selected = state[index] || "1";
        
        row.style.position = "absolute";
        row.style.top = (index * ROW_HEIGHT) + "px";
        row.style.width = "100%";
        
        row.innerHTML = 
            "<td>Row " + index + "</td>" +
            "<td><input type='radio' name='row" + index + "' value='1'" + (selected === "1" ? " checked" : "") + "></td>" +
            "<td><input type='radio' name='row" + index + "' value='2'" + (selected === "2" ? " checked" : "") + "></td>" +
            "<td><input type='radio' name='row" + index + "' value='3'" + (selected === "3" ? " checked" : "") + "></td>";
            
        return row;
    }
    
    /**
     * Renders visible rows based on scroll position
     * Uses document fragment for performance
     */
    function renderRows() {
        var scrollTop = container.scrollTop;
        var startIndex = Math.max(1, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
        var endIndex = Math.min(TOTAL_ROWS, startIndex + VISIBLE_ROWS + BUFFER);
        
        // Efficiently clear and rebuild rows
        while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);
        
        var fragment = document.createDocumentFragment();
        for (var i = startIndex; i < endIndex; i++) {
            fragment.appendChild(createRow(i));
        }
        tableBody.appendChild(fragment);
    }

    /**
     * Initiates smooth scrolling in specified direction
     * @param {string} direction - 'up' or 'down'
     */
    function startContinuousScroll(direction) {
        if (scrollInterval) return;
        
        var lastTime = performance.now();
        
        function scroll() {
            if (!scrollInterval) return;
            
            var deltaTime = performance.now() - lastTime;
            lastTime = performance.now();
            
            var currentScroll = container.scrollTop;
            var maxScroll = (TOTAL_ROWS * ROW_HEIGHT) - container.clientHeight;
            
            if (direction === 'up') {
                currentScroll = Math.max(0, currentScroll - SCROLL_SPEED * deltaTime / 16);
                if (currentScroll <= 0) {
                    container.scrollTop = 0;
                    stopContinuousScroll();
                    return;
                }
            } else {
                currentScroll = Math.min(maxScroll, currentScroll + SCROLL_SPEED * deltaTime / 16);
                if (currentScroll >= maxScroll) {
                    container.scrollTop = maxScroll;
                    stopContinuousScroll();
                    return;
                }
            }
            
            container.scrollTop = currentScroll;
            scrollInterval = requestAnimationFrame(scroll);
        }
        
        scrollInterval = requestAnimationFrame(scroll);
    }

    /**
     * Stops continuous scrolling animation
     */
    function stopContinuousScroll() {
        if (scrollInterval) {
            cancelAnimationFrame(scrollInterval);
            scrollInterval = null;
        }
    }
    
    // Handle scrollbar interactions
    container.onmousedown = function(e) {
        var rect = container.getBoundingClientRect();
        var scrollbarWidth = container.offsetWidth - container.clientWidth;
        
        // Ignore clicks not on scrollbar
        if (e.clientX <= rect.right - scrollbarWidth) return;
        
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

    // Clean up scroll animation
    document.addEventListener("mouseup", stopContinuousScroll);
    container.addEventListener("mouseleave", stopContinuousScroll);
    
    renderRows();
};