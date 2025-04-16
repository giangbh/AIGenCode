/**
 * Chart utility functions
 * Helper functions for creating and updating charts
 */

/**
 * Create a pie chart
 * @param {string} elementId - The ID of the canvas element
 * @param {Array} data - The data array for the chart
 * @param {Array} labels - The labels array for the chart
 * @param {Array} backgroundColors - The background colors array for the chart
 * @param {string} title - The chart title
 * @param {boolean} enableClickInteraction - Whether to enable click interaction
 * @returns {Object} - The chart object
 */
export function createPieChart(elementId, data, labels, backgroundColors, title, enableClickInteraction = false) {
    const ctx = document.getElementById(elementId).getContext('2d');
    
    // Cấu hình chung cho biểu đồ
    const config = {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1,
                borderColor: '#fff',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: title ? true : false,
                    text: title || '',
                    font: {
                        size: 16,
                    },
                    padding: {
                        bottom: 10
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        boxWidth: 12,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.formattedValue || '';
                            const dataset = context.dataset;
                            const total = dataset.data.reduce((acc, data) => acc + data, 0);
                            const percentage = Math.round((context.raw / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    };
    
    // Nếu kích hoạt tương tác nhấp chuột
    if (enableClickInteraction) {
        config.options.onClick = (event, elements) => {
            if (elements && elements.length > 0) {
                // Đã xử lý sự kiện click trong ReportsUIController
                // Hàm này chỉ để kích hoạt mode plugin "nearest" 
                // để có thể bắt được sự kiện click trên biểu đồ
                console.log("Đã click vào phân loại:", labels[elements[0].index]);
            }
        };
        
        // Thêm con trỏ chuột để hiển thị rằng người dùng có thể nhấp vào phần tử
        config.options.onHover = (event, elements) => {
            const chartElement = document.getElementById(elementId);
            if (elements && elements.length > 0) {
                chartElement.style.cursor = 'pointer';
            } else {
                chartElement.style.cursor = 'default';
            }
        };
    }
    
    return new Chart(ctx, config);
}

/**
 * Create a bar chart
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} data - Data for the chart
 * @param {Array} labels - Labels for the chart
 * @param {string} label - Label for the dataset
 * @param {string} color - Color for the bars
 * @param {string} title - Title for the chart
 * @returns {Chart} The created chart instance
 */
export function createBarChart(canvasId, data, labels, label, color, title = '') {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: color,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: label !== '',
                    position: 'top',
                },
                title: {
                    display: title !== '',
                    text: title,
                    font: {
                        size: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw || 0;
                            return `${value.toLocaleString('vi-VN')} VNĐ`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('vi-VN') + ' VNĐ';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create a multi-bar chart (multiple datasets)
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} datasets - Array of dataset objects
 * @param {Array} labels - Labels for the chart
 * @param {string} title - Title for the chart
 * @returns {Chart} The created chart instance
 */
export function createMultiBarChart(canvasId, datasets, labels, title = '') {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: title !== '',
                    text: title,
                    font: {
                        size: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value.toLocaleString('vi-VN')} VNĐ`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('vi-VN') + ' VNĐ';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create a line chart
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} data - Data for the chart
 * @param {Array} labels - Labels for the chart
 * @param {string} label - Label for the dataset
 * @param {string} color - Color for the line
 * @param {string} title - Title for the chart
 * @returns {Chart} The created chart instance
 */
export function createLineChart(canvasId, data, labels, label, color, title = '') {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color.replace(')', ', 0.1)').replace('rgb', 'rgba'),
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: label !== '',
                    position: 'top',
                },
                title: {
                    display: title !== '',
                    text: title,
                    font: {
                        size: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw || 0;
                            return `${value.toLocaleString('vi-VN')} VNĐ`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('vi-VN') + ' VNĐ';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create a multi-line chart (multiple datasets)
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} datasets - Array of dataset objects
 * @param {Array} labels - Labels for the chart
 * @param {string} title - Title for the chart
 * @returns {Chart} The created chart instance
 */
export function createMultiLineChart(canvasId, datasets, labels, title = '') {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets.map(dataset => ({
                ...dataset,
                borderWidth: 2,
                fill: false,
                tension: 0.1
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: title !== '',
                    text: title,
                    font: {
                        size: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value.toLocaleString('vi-VN')} VNĐ`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('vi-VN') + ' VNĐ';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Update chart data
 * @param {Chart} chart - The chart to update
 * @param {Array} data - New data for the chart
 * @param {Array} labels - New labels for the chart
 */
export function updateChartData(chart, data, labels) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

/**
 * Generate random pastel colors
 * @param {number} count - Number of colors to generate
 * @returns {Array} Array of color strings
 */
export function generatePastelColors(count) {
    const colors = [];
    const hueStep = 360 / count;
    
    for (let i = 0; i < count; i++) {
        const hue = i * hueStep;
        colors.push(`hsl(${hue}, 70%, 80%)`);
    }
    
    return colors;
} 