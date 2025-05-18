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

/**
 * Creates a bar chart visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} headers - Question headers
 * @param {Array} counts - Answer counts for each question
 * @returns {Chart} Chart.js instance
 */
function createBarChart(ctx, headers, counts) {
    const options = [
        "Highly motivating",
        "Moderately motivating",
        "Slightly motivating",
        "Not motivating"
    ];
    const colors = ['#4caf50', '#ffeb3b', '#ff9800', '#f44336'];

    const datasets = options.map((option, idx) => ({
        label: option,
        data: counts.map(c => c[option]),
        backgroundColor: colors[idx],
        borderColor: colors[idx],
        borderWidth: 1
    }));

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: headers.map(header => 
                header.length > 30 ? header.substring(0, 27) + '...' : header
            ),
            datasets: datasets
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'right',
                    labels: { padding: 20 }
                },
                title: { 
                    display: true, 
                    text: 'Employee Motivation Factors',
                    padding: 20,
                    font: { size: 16 }
                }
            },
            scales: {
                x: { 
                    stacked: true,
                    position: 'top',
                    ticks: {
                        beginAtZero: true,
                        stepSize: 1
                    }
                },
                y: { 
                    stacked: true,
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0
                    }
                }
            }
        },
        plugins: [{
            id: 'customLabels',
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 12px Arial';
                ctx.fillStyle = 'white';

                const meta = chart.getDatasetMeta(0);
                meta.data.forEach((_, index) => {
                    let xStart = chart.chartArea.left;
                    const y = chart.getDatasetMeta(0).data[index].y;

                    chart.data.datasets.forEach((dataset, datasetIndex) => {
                        const value = dataset.data[index];
                        if (value > 0) {
                            const barElement = chart.getDatasetMeta(datasetIndex).data[index];
                            const barWidth = barElement.width;
                            const xCenter = xStart + (barWidth / 2);
                            
                            if (barWidth > 25) {
                                ctx.fillText(value.toString(), xCenter, y);
                            }
                            xStart += barWidth;
                        }
                    });
                });

                ctx.restore();
            }
        }]
    });
}

/**
 * Renders the appropriate chart type
 * @param {Array} headers - Question headers
 * @param {Array} counts - Answer counts
 */
function drawChart(headers, counts) {
    const ctx = document.getElementById('myChart').getContext('2d');
    
    // Clear previous chart if exists
    if (window.myChartInstance) {
        window.myChartInstance.destroy();
    }

    const chartType = document.getElementById('chartType').value;
    
    if (chartType === 'bar') {
        window.myChartInstance = createBarChart(ctx, headers, counts);
    }
    // Pie chart implementation will be added later
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
                drawChart(headers, answerCounts);
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
                drawChart(headers, answerCounts);
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

// Chart type change handling
document.getElementById('chartType').addEventListener('change', function() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length > 0) {
        // Trigger file processing again to redraw the chart
        fileInput.dispatchEvent(new Event('change'));
    }
}); 