/**
 * Maps utilities for CafeThu6
 * Cung cấp các chức năng bản đồ sử dụng Leaflet
 */

/**
 * Khởi tạo bản đồ Leaflet trong phần tử được chỉ định
 * @param {string} elementId - ID của phần tử HTML để đặt bản đồ
 * @param {Object} location - Đối tượng vị trí {lat, lng, name}
 * @param {number} zoom - Mức zoom (1-20)
 * @returns {Object} Đối tượng map và marker
 */
export function initMap(elementId, location, zoom = 15) {
    const mapElement = document.getElementById(elementId);
    
    if (!mapElement || !L) {
        console.error('Leaflet không khả dụng hoặc không tìm thấy phần tử bản đồ');
        return { map: null, marker: null };
    }
    
    // Tạo bản đồ với Leaflet
    const map = L.map(elementId).setView([location.lat, location.lng], zoom);
    
    // Thêm OpenStreetMap layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Thêm marker với popup hiển thị tên địa điểm
    const marker = L.marker([location.lat, location.lng])
        .addTo(map)
        .bindPopup(location.name || 'Vị trí chi tiêu');
    
    if (location.name) {
        marker.openPopup();
    }
    
    return { map, marker };
}

/**
 * Lấy địa chỉ từ tọa độ lat/lng (reverse geocoding)
 * @param {number} lat - Vĩ độ
 * @param {number} lng - Kinh độ
 * @returns {Promise<string>} Promise trả về địa chỉ dưới dạng chuỗi
 */
export function getAddressFromCoordinates(lat, lng) {
    return new Promise((resolve, reject) => {
        // Sử dụng OpenStreetMap Nominatim API để reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể lấy địa chỉ từ tọa độ');
                }
                return response.json();
            })
            .then(data => {
                if (data && data.display_name) {
                    resolve(data.display_name);
                } else {
                    reject(new Error('Không tìm thấy địa chỉ'));
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

/**
 * Lấy vị trí hiện tại của người dùng
 * @returns {Promise<Object>} Promise trả về {lat, lng}
 */
export function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Trình duyệt không hỗ trợ định vị'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                let errorMessage = 'Không thể lấy vị trí';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Người dùng từ chối cấp quyền truy cập vị trí';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Thông tin vị trí không khả dụng';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Hết thời gian yêu cầu vị trí';
                        break;
                    case error.UNKNOWN_ERROR:
                        errorMessage = 'Đã xảy ra lỗi không xác định';
                        break;
                }
                
                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

/**
 * Debug utility to test location functionality
 * Call this from the console using:
 * window.debugMap()
 */
export function debugMapFunctionality() {
    console.log("=== Starting Map Debugging ===");
    
    // 1. Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error("Leaflet is not loaded! Check your script imports.");
        return;
    }
    console.log("Leaflet is loaded correctly:", L.version);
    
    // 2. Create a test div for the map
    let testDiv = document.getElementById('debug-map-container');
    if (!testDiv) {
        console.log("Creating test map container");
        testDiv = document.createElement('div');
        testDiv.id = 'debug-map-container';
        testDiv.style.width = '500px';
        testDiv.style.height = '300px';
        testDiv.style.position = 'fixed';
        testDiv.style.top = '10px';
        testDiv.style.right = '10px';
        testDiv.style.zIndex = '9999';
        testDiv.style.backgroundColor = 'white';
        testDiv.style.border = '2px solid #333';
        testDiv.style.borderRadius = '5px';
        testDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'X';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '5px';
        closeBtn.style.zIndex = '10000';
        closeBtn.style.background = 'red';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.width = '25px';
        closeBtn.style.height = '25px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => {
            document.body.removeChild(testDiv);
        };
        
        // Map container
        const mapDiv = document.createElement('div');
        mapDiv.id = 'debug-map';
        mapDiv.style.width = '100%';
        mapDiv.style.height = '250px';
        mapDiv.style.marginTop = '30px';
        
        // Title
        const title = document.createElement('div');
        title.textContent = 'Debug Map';
        title.style.padding = '5px';
        title.style.fontWeight = 'bold';
        title.style.textAlign = 'center';
        title.style.borderBottom = '1px solid #ccc';
        
        testDiv.appendChild(title);
        testDiv.appendChild(closeBtn);
        testDiv.appendChild(mapDiv);
        document.body.appendChild(testDiv);
    }
    
    // 3. Test location with hardcoded values
    const testLocation = {
        lat: 21.0285,
        lng: 105.8542,
        name: 'Test Location'
    };
    
    // 4. Initialize the map
    try {
        console.log("Initializing test map with location:", testLocation);
        const { map, marker } = initMap('debug-map', testLocation);
        
        console.log("Map initialized:", map);
        console.log("Marker initialized:", marker);
        
        if (map && marker) {
            console.log("Map initialization successful!");
        }
    } catch (error) {
        console.error("Error initializing map:", error);
    }
    
    // 5. Test getCurrentPosition function
    console.log("Testing getCurrentPosition...");
    getCurrentPosition()
        .then(position => {
            console.log("Current position obtained:", position);
        })
        .catch(error => {
            console.error("Error getting current position:", error);
        });
    
    console.log("=== Map Debugging Finished ===");
    console.log("You can use these functions directly:");
    console.log("- initMap(elementId, location, zoom)");
    console.log("- getCurrentPosition()");
    console.log("- getAddressFromCoordinates(lat, lng)");
}

// Make debug function available globally
if (typeof window !== 'undefined') {
    window.debugMap = debugMapFunctionality;
} 