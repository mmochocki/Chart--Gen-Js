/**
 * Parses CSV file content
 * @param {string} text - CSV file content
 * @returns {Object} Object containing headers and data
 */
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const data = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim())
    );
    return { headers, data };
}

/**
 * Parses XLSX file content
 * @param {ArrayBuffer} arrayBuffer - XLSX file content
 * @returns {Object} Object containing headers and data
 */
function parseXLSX(arrayBuffer) {
    const workbook = XLSX.read(arrayBuffer);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = data[0].map(header => header.trim());
    const rows = data.slice(1).map(row => 
        row.map(cell => cell ? cell.toString().trim() : '')
    );
    return { headers, data: rows };
}

/**
 * Counts answers for each question
 * @param {Array} data - Array of rows with answers
 * @param {Array} headers - Array of question headers
 * @returns {Array} Array of objects with answer counts for each question
 */
function countAnswers(data, headers) {
    // Possible answer options
    const options = [
        "Highly motivating",
        "Moderately motivating",
        "Slightly motivating",
        "Not motivating"
    ];
    
    // Initialize counters for each question
    const counts = headers.map(() => ({
        "Highly motivating": 0,
        "Moderately motivating": 0,
        "Slightly motivating": 0,
        "Not motivating": 0
    }));

    // Count answers for each question
    data.forEach(row => {
        row.forEach((answer, columnIndex) => {
            const cleanAnswer = answer.toString().trim();
            if (counts[columnIndex] && counts[columnIndex].hasOwnProperty(cleanAnswer)) {
                counts[columnIndex][cleanAnswer]++;
            }
        });
    });

    return counts;
}

// File upload handling
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onerror = function() {
        console.error('Error loading file');
        alert('An error occurred while loading the file. Please try again.');
    };

    if (file.name.toLowerCase().endsWith('.csv')) {
        reader.onload = function(event) {
            try {
                const text = event.target.result;
                const { headers, data } = parseCSV(text);
                const answerCounts = countAnswers(data, headers);
                console.log('CSV data processed:', { 
                    headers, 
                    rowCount: data.length,
                    answerCounts 
                });
                // Chart rendering function will be called here with headers and answerCounts
            } catch (error) {
                console.error('CSV processing error:', error);
                alert('Error processing CSV file. Please check the file format.');
            }
        };
        reader.readAsText(file);
    } else if (file.name.toLowerCase().match(/\.xlsx?$/)) {
        reader.onload = function(event) {
            try {
                const arrayBuffer = event.target.result;
                const { headers, data } = parseXLSX(arrayBuffer);
                const answerCounts = countAnswers(data, headers);
                console.log('XLSX data processed:', { 
                    headers, 
                    rowCount: data.length,
                    answerCounts 
                });
                // Chart rendering function will be called here with headers and answerCounts
            } catch (error) {
                console.error('XLSX processing error:', error);
                alert('Error processing XLSX file. Please check the file format.');
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Unsupported file format. Please select a CSV or XLSX file.');
    }
}); 