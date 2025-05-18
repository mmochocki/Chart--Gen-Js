/**
 * Parses CSV file content
 * @param {string} text - CSV file content
 * @returns {Object} Object containing headers and data
 */
function parseCSV(text) {
    try {
        // Normalizacja końców linii i usunięcie pustych linii
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
            .split('\n')
            .filter(line => line.trim().length > 0);

        if (lines.length < 2) {
            throw new Error('CSV file must contain at least headers and one row of data');
        }

        // Przetwarzanie nagłówków
        const headers = lines[0].split(',')
            .map(header => header.trim())
            .filter(header => header.length > 0);

        if (headers.length === 0) {
            throw new Error('No valid headers found in CSV file');
        }

        // Przetwarzanie danych
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().length === 0) continue;

            const values = line.split(',').map(value => {
                // Usuń cudzysłowy i białe znaki
                value = value.trim().replace(/^["']|["']$/g, '');
                return normalizeAnswer(value);
            });

            // Upewnij się, że wiersz ma odpowiednią liczbę kolumn
            while (values.length < headers.length) {
                values.push('');
            }

            data.push(values);
        }

        console.log('CSV Parse Results:', {
            headerCount: headers.length,
            headers: headers,
            rowCount: data.length,
            sampleRow: data[0]
        });

        return { headers, data };
    } catch (error) {
        console.error('Error parsing CSV:', error);
        throw error;
    }
}

/**
 * Parses XLSX file content
 * @param {ArrayBuffer} arrayBuffer - XLSX file content
 * @returns {Object} Object containing headers and data
 */
function parseXLSX(arrayBuffer) {
    try {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Konwertuj do tablicy z opcjami
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false // Konwertuj wszystkie wartości na string
        });

        if (rawData.length < 2) {
            throw new Error('XLSX file must contain at least headers and one row of data');
        }

        // Przetwarzanie nagłówków
        const headers = rawData[0]
            .map(header => header ? header.toString().trim() : '')
            .filter(header => header.length > 0);

        if (headers.length === 0) {
            throw new Error('No valid headers found in XLSX file');
        }

        // Przetwarzanie danych
        const data = rawData.slice(1)
            .filter(row => row.some(cell => cell && cell.toString().trim().length > 0))
            .map(row => {
                const processedRow = row.map(cell => {
                    const value = cell ? cell.toString().trim() : '';
                    return normalizeAnswer(value);
                });

                // Upewnij się, że wiersz ma odpowiednią liczbę kolumn
                while (processedRow.length < headers.length) {
                    processedRow.push('');
                }

                return processedRow;
            });

        console.log('XLSX Parse Results:', {
            headerCount: headers.length,
            headers: headers,
            rowCount: data.length,
            sampleRow: data[0]
        });

        return { headers, data };
    } catch (error) {
        console.error('Error parsing XLSX:', error);
        throw error;
    }
}

/**
 * Normalizes answer values to match expected format
 * @param {string} answer - Raw answer value
 * @returns {string} Normalized answer
 */
function normalizeAnswer(answer) {
    if (!answer) return '';
    
    // Usuń zbędne białe znaki i zamień na string
    answer = answer.toString().trim();
    
    // Mapowanie możliwych wartości na standardowe odpowiedzi
    const answerMap = {
        // Angielskie odpowiedzi
        'highly motivating': 'Highly motivating',
        'moderately motivating': 'Moderately motivating',
        'slightly motivating': 'Slightly motivating',
        'not motivating': 'Not motivating',
        'high': 'Highly motivating',
        'moderate': 'Moderately motivating',
        'slight': 'Slightly motivating',
        'none': 'Not motivating',
        
        // Polskie odpowiedzi
        'bardzo motywuje': 'Highly motivating',
        'średnio motywuje': 'Moderately motivating',
        'słabo motywuje': 'Slightly motivating',
        'nie motywuje': 'Not motivating'
    };

    // Sprawdź czy odpowiedź pasuje do któregoś z wariantów
    const lowerAnswer = answer.toLowerCase();
    if (answerMap.hasOwnProperty(lowerAnswer)) {
        return answerMap[lowerAnswer];
    }

    // Jeśli odpowiedź jest dokładnie jedną z dozwolonych wartości
    const validAnswers = [
        "Highly motivating",
        "Moderately motivating",
        "Slightly motivating",
        "Not motivating"
    ];

    if (validAnswers.includes(answer)) {
        return answer;
    }

    console.warn(`Unrecognized answer value: "${answer}"`);
    return answer;
}

/**
 * Validates and processes input data
 * @param {Array} data - Raw data array
 * @param {Array} headers - Headers array
 * @returns {Object} Processed and validated data
 */
function validateAndProcessData(data, headers) {
    if (!Array.isArray(data) || !Array.isArray(headers)) {
        throw new Error('Nieprawidłowy format danych - oczekiwano tablic');
    }

    if (headers.length === 0) {
        throw new Error('Brak nagłówków w pliku');
    }

    if (data.length === 0) {
        throw new Error('Brak danych w pliku');
    }

    // Sprawdź czy wszystkie nagłówki są niepuste
    const validHeaders = headers.filter(h => h && h.trim().length > 0);
    if (validHeaders.length === 0) {
        throw new Error('Wszystkie nagłówki są puste');
    }

    // Sprawdź format danych
    const validOptions = [
        "Highly motivating",
        "Moderately motivating",
        "Slightly motivating",
        "Not motivating"
    ];

    let validAnswersFound = false;
    data.forEach((row, rowIndex) => {
        if (!Array.isArray(row)) {
            throw new Error(`Wiersz ${rowIndex + 1} nie jest tablicą`);
        }
        
        row.forEach((answer, colIndex) => {
            if (answer && validOptions.includes(answer.trim())) {
                validAnswersFound = true;
            }
        });
    });

    if (!validAnswersFound) {
        throw new Error('Nie znaleziono żadnych prawidłowych odpowiedzi. Dozwolone odpowiedzi to: ' + validOptions.join(', '));
    }

    return {
        headers: validHeaders,
        data: data
    };
}

/**
 * Counts answers for each question
 * @param {Array} data - Array of rows with answers
 * @param {Array} headers - Array of question headers
 * @returns {Array} Array of objects with answer counts for each question
 */
function countAnswers(data, headers) {
    console.log('Rozpoczynam liczenie odpowiedzi:', {
        liczbaWierszy: data.length,
        liczbaKolumn: headers.length
    });

    const validOptions = [
        "Highly motivating",
        "Moderately motivating",
        "Slightly motivating",
        "Not motivating"
    ];

    // Inicjalizacja liczników
    const counts = headers.map(() => ({
        "Highly motivating": 0,
        "Moderately motivating": 0,
        "Slightly motivating": 0,
        "Not motivating": 0
    }));

    let totalAnswers = 0;
    let invalidAnswers = [];

    // Zliczanie odpowiedzi
    data.forEach((row, rowIndex) => {
        row.forEach((answer, colIndex) => {
            if (colIndex >= headers.length) return;

            const cleanAnswer = answer ? answer.toString().trim() : '';
            if (!cleanAnswer) {
                console.log(`Pusta odpowiedź w wierszu ${rowIndex + 1}, kolumnie ${colIndex + 1}`);
                return;
            }

            if (validOptions.includes(cleanAnswer)) {
                counts[colIndex][cleanAnswer]++;
                totalAnswers++;
            } else {
                invalidAnswers.push({
                    wiersz: rowIndex + 1,
                    kolumna: colIndex + 1,
                    wartość: cleanAnswer
                });
            }
        });
    });

    // Logowanie wyników
    console.log('Wyniki zliczania:', {
        poprawneOdpowiedzi: totalAnswers,
        nieprawidłoweOdpowiedzi: invalidAnswers.length,
        przykładoweNieprawidłoweOdpowiedzi: invalidAnswers.slice(0, 5),
        sumaOdpowiedziDlaPytań: counts.map((q, idx) => ({
            pytanie: idx + 1,
            suma: Object.values(q).reduce((a, b) => a + b, 0)
        }))
    });

    if (totalAnswers === 0) {
        throw new Error('Nie znaleziono żadnych prawidłowych odpowiedzi w pliku');
    }

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

    // Przygotuj dane do wykresu
    const datasets = [];
    options.forEach((option, idx) => {
        const data = [];
        counts.forEach(questionCount => {
            data.push(questionCount[option] || 0);
        });
        
        datasets.push({
            label: option,
            data: data,
            backgroundColor: colors[idx],
            borderColor: colors[idx],
            borderWidth: 1
        });
    });

    // Sprawdź czy są jakieś dane
    const hasData = datasets.some(dataset => 
        dataset.data.some(value => value > 0)
    );

    if (!hasData) {
        console.error('No data available for chart');
        return null;
    }

    // Przygotuj etykiety
    const labels = headers.map(header => {
        if (!header) return 'Unnamed Question';
        return header.length > 30 ? header.substring(0, 27) + '...' : header;
    });

    console.log('Chart Data:', {
        labels: labels,
        datasets: datasets.map(ds => ({
            label: ds.label,
            dataPoints: ds.data
        }))
    });

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const value = context.raw || 0;
                            const total = context.chart.data.datasets.reduce((sum, dataset) => 
                                sum + (dataset.data[context.dataIndex] || 0), 0
                            );
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${context.dataset.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Creates a pie chart visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} headers - Question headers
 * @param {Array} counts - Answer counts for each question
 * @returns {Chart} Chart.js instance
 */
function createPieChart(ctx, headers, counts) {
    const options = [
        "Highly motivating",
        "Moderately motivating",
        "Slightly motivating",
        "Not motivating"
    ];
    const colors = ['#4caf50', '#ffeb3b', '#ff9800', '#f44336'];
    
    const totals = options.map(option => 
        counts.reduce((sum, count) => sum + count[option], 0)
    );

    const totalResponses = totals.reduce((a, b) => a + b, 0);

    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: options,
            datasets: [{
                data: totals,
                backgroundColor: colors,
                borderColor: colors.map(color => color),
                borderWidth: 1,
                hoverBackgroundColor: colors.map(color => color + 'dd'),
                hoverBorderColor: colors,
                hoverBorderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = ((value / totalResponses) * 100).toFixed(1);
                                    return {
                                        text: `${label}: ${value} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].borderColor[i],
                                        lineWidth: 1,
                                        hidden: isNaN(data.datasets[0].data[i]) || data.datasets[0].data[i] === 0,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    },
                    onClick: function(e, legendItem, legend) {
                        const index = legendItem.index;
                        const chart = legend.chart;
                        const meta = chart.getDatasetMeta(0);
                        meta.data[index].hidden = !meta.data[index].hidden;
                        chart.update();
                    }
                },
                title: {
                    display: true,
                    text: 'Overall Response Distribution',
                    padding: 20,
                    font: { size: 16 }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = ((value / totalResponses) * 100).toFixed(1);
                            return [
                                `${context.label}:`,
                                `${value} responses (${percentage}%)`
                            ];
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 750,
                easing: 'easeInOutQuart'
            }
        },
        plugins: [{
            id: 'pieChartLabels',
            afterDraw: function(chart) {
                const ctx = chart.ctx;
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = 'white';

                const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);

                chart.data.datasets[0].data.forEach((value, i) => {
                    if (value === 0 || chart.getDatasetMeta(0).data[i].hidden) return;

                    const percentage = ((value / total) * 100).toFixed(1);
                    const meta = chart.getDatasetMeta(0);
                    const arc = meta.data[i];
                    
                    if (percentage > 5) {
                        const angle = arc.startAngle + (arc.endAngle - arc.startAngle) / 2;
                        const radius = arc.outerRadius * 0.6;
                        const x = arc.x + Math.cos(angle) * radius;
                        const y = arc.y + Math.sin(angle) * radius;
                        
                        // Add shadow effect for better readability
                        ctx.shadowColor = 'rgba(0,0,0,0.5)';
                        ctx.shadowBlur = 2;
                        ctx.fillText(`${percentage}%`, x, y);
                        ctx.shadowBlur = 0;
                    }
                });

                ctx.restore();
            }
        }]
    });
}

/**
 * Stores the last loaded data to enable chart type switching without file reupload
 */
let lastLoadedData = {
    headers: null,
    counts: null
};

/**
 * Renders the appropriate chart type with animation
 * @param {Array} headers - Question headers
 * @param {Array} counts - Answer counts
 */
function drawChart(headers, counts) {
    if (!headers || !counts || headers.length === 0 || counts.length === 0) {
        console.error('Invalid data for chart:', { headers, counts });
        alert('Nie można utworzyć wykresu - brak poprawnych danych.');
        return;
    }

    console.log('Drawing chart with:', {
        headerCount: headers.length,
        countsLength: counts.length,
        headers: headers,
        counts: counts
    });

    const canvas = document.getElementById('myChart');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Zniszcz poprzedni wykres jeśli istnieje
    if (window.myChartInstance) {
        window.myChartInstance.destroy();
    }

    try {
        const chartType = document.getElementById('chartType').value;
        
        if (chartType === 'bar') {
            window.myChartInstance = createBarChart(ctx, headers, counts);
        } else if (chartType === 'pie') {
            window.myChartInstance = createPieChart(ctx, headers, counts);
        }

        if (!window.myChartInstance) {
            throw new Error('Failed to create chart instance');
        }
    } catch (error) {
        console.error('Error creating chart:', error);
        alert('Wystąpił błąd podczas tworzenia wykresu. Sprawdź dane wejściowe.');
    }
}

// Obsługa wczytywania pliku
document.getElementById('fileInput').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        console.log('Rozpoczynam przetwarzanie pliku:', {
            nazwa: file.name,
            rozmiar: file.size,
            typ: file.type
        });

        let headers, data;

        if (file.name.toLowerCase().endsWith('.csv')) {
            const text = await file.text();
            console.log('Wczytano zawartość CSV:', text.substring(0, 200) + '...');
            ({ headers, data } = parseCSV(text));
        } else if (file.name.toLowerCase().match(/\.xlsx?$/)) {
            const arrayBuffer = await file.arrayBuffer();
            ({ headers, data } = parseXLSX(arrayBuffer));
        } else {
            throw new Error('Nieobsługiwany format pliku. Wybierz plik CSV lub XLSX.');
        }

        // Walidacja i przetwarzanie danych
        const validatedData = validateAndProcessData(data, headers);
        console.log('Dane po walidacji:', {
            liczbaWierszy: validatedData.data.length,
            liczbaKolumn: validatedData.headers.length,
            przykładowyWiersz: validatedData.data[0]
        });

        const counts = countAnswers(validatedData.data, validatedData.headers);
        
        // Sprawdź czy są jakieś dane do wyświetlenia
        const hasData = counts.some(questionCounts => 
            Object.values(questionCounts).some(count => count > 0)
        );

        if (!hasData) {
            throw new Error('Brak danych do wyświetlenia na wykresie');
        }

        drawChart(validatedData.headers, counts);
    } catch (error) {
        console.error('Szczegóły błędu:', error);
        alert('Błąd podczas przetwarzania pliku: ' + error.message);
    }
});

// Chart type change handling with animation
document.getElementById('chartType').addEventListener('change', function() {
    if (lastLoadedData.headers && lastLoadedData.counts) {
        // Use stored data to redraw chart
        drawChart(lastLoadedData.headers, lastLoadedData.counts);
    } else {
        const fileInput = document.getElementById('fileInput');
        if (fileInput.files.length > 0) {
            // If no stored data but file is selected, trigger file processing
            fileInput.dispatchEvent(new Event('change'));
        } else {
            console.warn('No data available to change chart type');
        }
    }
}); 