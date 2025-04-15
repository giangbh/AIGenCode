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