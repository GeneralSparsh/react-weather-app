// Weather App JavaScript
class WeatherApp {
    constructor() {
        // API Configuration
        this.apiKey = 'e707c76ced5647cc80d95023251108';
        this.apiEndpoints = {
            current: 'https://api.weatherapi.com/v1/current.json',
            forecast: 'https://api.weatherapi.com/v1/forecast.json',
            search: 'https://api.weatherapi.com/v1/search.json'
        };

        // Weather icons mapping
        this.weatherIcons = {
            1000: '☀️', 1003: '⛅', 1006: '☁️', 1009: '☁️', 1030: '🌫️',
            1063: '🌦️', 1066: '🌨️', 1069: '🌨️', 1072: '🌦️', 1087: '⛈️',
            1114: '🌨️', 1117: '🌨️', 1135: '🌫️', 1147: '🌫️', 1150: '🌦️',
            1153: '🌦️', 1168: '🌦️', 1171: '🌦️', 1180: '🌧️', 1183: '🌧️',
            1186: '🌧️', 1189: '🌧️', 1192: '🌧️', 1195: '🌧️', 1198: '🌧️',
            1201: '🌧️', 1204: '🌨️', 1207: '🌨️', 1210: '🌨️', 1213: '🌨️',
            1216: '🌨️', 1219: '🌨️', 1222: '🌨️', 1225: '🌨️', 1237: '🌨️',
            1240: '🌧️', 1243: '🌧️', 1246: '🌧️', 1249: '🌨️', 1252: '🌨️',
            1255: '🌨️', 1258: '🌨️', 1261: '🌨️', 1264: '🌨️', 1273: '⛈️',
            1276: '⛈️', 1279: '⛈️', 1282: '⛈️'
        };

        // App state
        this.state = {
            currentWeather: null,
            forecastData: null,
            loading: false,
            error: null,
            currentCity: 'London',
            isCelsius: true,
            recentSearches: this.loadRecentSearches(),
            searchTimeout: null
        };

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        await this.waitForDOM();
        this.bindElements();
        this.bindEvents();
        this.loadPreferences();
        this.updateRecentSearches();
        this.updateUnitToggle();
        
        // Load default city weather
        await this.fetchWeatherData(this.state.currentCity);
    }

    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
    }

    bindElements() {
        // Get all required elements
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.unitToggle = document.getElementById('unitToggle');
        this.locationBtn = document.getElementById('locationBtn');
        this.retryBtn = document.getElementById('retryBtn');
        
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.weatherContent = document.getElementById('weatherContent');
        this.suggestionsDropdown = document.getElementById('suggestionsDropdown');
        this.recentSearches = document.getElementById('recentSearches');
        this.recentCities = document.getElementById('recentCities');
        this.weatherAlerts = document.getElementById('weatherAlerts');
        
        // Current weather elements
        this.cityName = document.getElementById('cityName');
        this.locationDetails = document.getElementById('locationDetails');
        this.localTime = document.getElementById('localTime');
        this.currentTemp = document.getElementById('currentTemp');
        this.weatherIcon = document.getElementById('weatherIcon');
        this.weatherCondition = document.getElementById('weatherCondition');
        this.feelsLike = document.getElementById('feelsLike');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.pressure = document.getElementById('pressure');
        this.visibility = document.getElementById('visibility');
        this.uvIndex = document.getElementById('uvIndex');
        this.airQuality = document.getElementById('airQuality');
        
        // Forecast elements
        this.forecastDate = document.getElementById('forecastDate');
        this.tempHigh = document.getElementById('tempHigh');
        this.tempLow = document.getElementById('tempLow');
        this.forecastIcon = document.getElementById('forecastIcon');
        this.forecastCondition = document.getElementById('forecastCondition');
        this.chanceOfRain = document.getElementById('chanceOfRain');
        this.sunrise = document.getElementById('sunrise');
        this.sunset = document.getElementById('sunset');
        this.maxWind = document.getElementById('maxWind');
        this.avgHumidity = document.getElementById('avgHumidity');
        
        // Other elements
        this.errorText = document.getElementById('errorText');
        this.alertContent = document.getElementById('alertContent');
        this.app = document.getElementById('app');
    }

    bindEvents() {
        // Search input events
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                e.stopPropagation();
                this.handleSearchInput();
            });
            
            this.searchInput.addEventListener('keydown', (e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearch();
                }
                if (e.key === 'Escape') {
                    this.hideSuggestions();
                }
            });

            // Prevent the scrolling issue
            this.searchInput.addEventListener('focus', (e) => {
                e.stopPropagation();
                setTimeout(() => {
                    if (this.searchInput) {
                        this.searchInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                }, 100);
            });
        }

        // Search button
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleSearch();
            });
        }

        // Unit toggle button
        if (this.unitToggle) {
            this.unitToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleUnits();
            });
        }

        // Location button
        if (this.locationBtn) {
            this.locationBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.useCurrentLocation();
            });
        }

        // Retry button
        if (this.retryBtn) {
            this.retryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.retryWeatherFetch();
            });
        }

        // Document click for hiding suggestions
        document.addEventListener('click', (e) => {
            if (this.searchInput && this.suggestionsDropdown) {
                if (!this.searchInput.contains(e.target) && !this.suggestionsDropdown.contains(e.target)) {
                    this.hideSuggestions();
                }
            }
        });
    }

    loadPreferences() {
        try {
            const saved = localStorage.getItem('weatherAppPreferences');
            if (saved) {
                const preferences = JSON.parse(saved);
                this.state.isCelsius = preferences.isCelsius !== undefined ? preferences.isCelsius : true;
                this.state.currentCity = preferences.currentCity || 'London';
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    savePreferences() {
        try {
            localStorage.setItem('weatherAppPreferences', JSON.stringify({
                isCelsius: this.state.isCelsius,
                currentCity: this.state.currentCity
            }));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    loadRecentSearches() {
        try {
            const saved = localStorage.getItem('weatherAppRecentSearches');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    }

    saveRecentSearches() {
        try {
            localStorage.setItem('weatherAppRecentSearches', JSON.stringify(this.state.recentSearches));
        } catch (error) {
            console.error('Error saving recent searches:', error);
        }
    }

    addToRecentSearches(city) {
        const existing = this.state.recentSearches.findIndex(item => 
            item.toLowerCase() === city.toLowerCase()
        );
        
        if (existing > -1) {
            this.state.recentSearches.splice(existing, 1);
        }
        
        this.state.recentSearches.unshift(city);
        this.state.recentSearches = this.state.recentSearches.slice(0, 5);
        
        this.saveRecentSearches();
        this.updateRecentSearches();
    }

    updateRecentSearches() {
        if (!this.recentCities || !this.recentSearches) return;

        if (this.state.recentSearches.length > 0) {
            this.recentCities.innerHTML = this.state.recentSearches
                .map(city => `<span class="recent-city" data-city="${city}">${city}</span>`)
                .join('');
            
            this.recentSearches.classList.remove('hidden');
            
            // Add click events to recent cities
            this.recentCities.querySelectorAll('.recent-city').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.fetchWeatherData(el.dataset.city);
                    if (this.searchInput) {
                        this.searchInput.value = '';
                    }
                });
            });
        } else {
            this.recentSearches.classList.add('hidden');
        }
    }

    handleSearchInput() {
        if (!this.searchInput) return;
        
        const query = this.searchInput.value.trim();
        
        if (this.state.searchTimeout) {
            clearTimeout(this.state.searchTimeout);
        }

        if (query.length > 2) {
            this.state.searchTimeout = setTimeout(() => {
                this.fetchCitySuggestions(query);
            }, 300);
        } else {
            this.hideSuggestions();
        }
    }

    handleSearch() {
        if (!this.searchInput) return;
        
        const query = this.searchInput.value.trim();
        
        if (query) {
            this.fetchWeatherData(query);
            this.hideSuggestions();
            this.searchInput.value = '';
        }
    }

    async fetchCitySuggestions(query) {
        if (!this.suggestionsDropdown) return;

        try {
            const url = `${this.apiEndpoints.search}?key=${this.apiKey}&q=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                this.hideSuggestions();
                return;
            }
            
            const suggestions = await response.json();
            this.displaySuggestions(suggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            this.hideSuggestions();
        }
    }

    displaySuggestions(suggestions) {
        if (!this.suggestionsDropdown || suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        const html = suggestions.slice(0, 5).map(city => {
            return `<div class="suggestion-item" data-city="${city.name}">
                <strong>${city.name}</strong>, ${city.region}, ${city.country}
            </div>`;
        }).join('');

        this.suggestionsDropdown.innerHTML = html;
        this.suggestionsDropdown.classList.remove('hidden');

        // Add click events
        this.suggestionsDropdown.querySelectorAll('.suggestion-item').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const cityName = el.dataset.city;
                if (this.searchInput) {
                    this.searchInput.value = '';
                }
                this.fetchWeatherData(cityName);
                this.hideSuggestions();
            });
        });
    }

    hideSuggestions() {
        if (this.suggestionsDropdown) {
            this.suggestionsDropdown.classList.add('hidden');
        }
    }

    async fetchWeatherData(city) {
        this.setLoading(true);
        this.setError(null);

        try {
            // Construct URLs
            const currentUrl = `${this.apiEndpoints.current}?key=${this.apiKey}&q=${encodeURIComponent(city)}&aqi=yes`;
            const forecastUrl = `${this.apiEndpoints.forecast}?key=${this.apiKey}&q=${encodeURIComponent(city)}&days=2&aqi=yes&alerts=yes`;
            
            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(currentUrl),
                fetch(forecastUrl)
            ]);

            if (!currentResponse.ok || !forecastResponse.ok) {
                throw new Error('City not found or API error');
            }

            const [currentData, forecastData] = await Promise.all([
                currentResponse.json(),
                forecastResponse.json()
            ]);

            this.state.currentWeather = currentData;
            this.state.forecastData = forecastData;
            this.state.currentCity = currentData.location.name;

            this.addToRecentSearches(this.state.currentCity);
            this.savePreferences();
            
            this.updateWeatherDisplay();
            this.updateWeatherTheme();
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.setError(`Unable to fetch weather data for "${city}". Please check the city name and try again.`);
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.state.loading = loading;
        
        if (loading) {
            if (this.loadingSpinner) this.loadingSpinner.classList.remove('hidden');
            if (this.weatherContent) this.weatherContent.classList.add('hidden');
            if (this.errorMessage) this.errorMessage.classList.add('hidden');
        } else {
            if (this.loadingSpinner) this.loadingSpinner.classList.add('hidden');
        }
    }

    setError(error) {
        this.state.error = error;
        
        if (error && this.errorMessage && this.errorText) {
            this.errorText.textContent = error;
            this.errorMessage.classList.remove('hidden');
            if (this.weatherContent) this.weatherContent.classList.add('hidden');
        } else if (this.errorMessage) {
            this.errorMessage.classList.add('hidden');
        }
    }

    updateWeatherDisplay() {
        if (!this.state.currentWeather || !this.state.forecastData) return;

        const current = this.state.currentWeather.current;
        const location = this.state.currentWeather.location;
        const tomorrow = this.state.forecastData.forecast.forecastday[1];

        // Update current weather
        if (this.cityName) this.cityName.textContent = location.name;
        if (this.locationDetails) this.locationDetails.textContent = `${location.region}, ${location.country}`;
        if (this.localTime) this.localTime.textContent = this.formatDateTime(location.localtime);
        
        if (this.currentTemp) this.currentTemp.textContent = this.formatTemperature(current.temp_c, current.temp_f);
        if (this.weatherIcon) this.weatherIcon.textContent = this.weatherIcons[current.condition.code] || '🌤️';
        if (this.weatherCondition) this.weatherCondition.textContent = current.condition.text;
        if (this.feelsLike) this.feelsLike.textContent = `Feels like ${this.formatTemperature(current.feelslike_c, current.feelslike_f)}`;
        
        if (this.humidity) this.humidity.textContent = `${current.humidity}%`;
        if (this.windSpeed) this.windSpeed.textContent = this.state.isCelsius ? `${current.wind_kph} km/h ${current.wind_dir}` : `${current.wind_mph} mph ${current.wind_dir}`;
        if (this.pressure) this.pressure.textContent = this.state.isCelsius ? `${current.pressure_mb} mb` : `${current.pressure_in} in`;
        if (this.visibility) this.visibility.textContent = this.state.isCelsius ? `${current.vis_km} km` : `${current.vis_miles} mi`;
        if (this.uvIndex) this.uvIndex.textContent = current.uv;
        
        // Air quality
        const aqiIndex = current.air_quality?.['us-epa-index'] || 1;
        this.updateAirQuality(aqiIndex);

        // Update forecast
        if (tomorrow) {
            if (this.forecastDate) this.forecastDate.textContent = this.formatDate(tomorrow.date);
            if (this.tempHigh) this.tempHigh.textContent = this.formatTemperature(tomorrow.day.maxtemp_c, tomorrow.day.maxtemp_f);
            if (this.tempLow) this.tempLow.textContent = this.formatTemperature(tomorrow.day.mintemp_c, tomorrow.day.mintemp_f);
            if (this.forecastIcon) this.forecastIcon.textContent = this.weatherIcons[tomorrow.day.condition.code] || '🌤️';
            if (this.forecastCondition) this.forecastCondition.textContent = tomorrow.day.condition.text;
            if (this.chanceOfRain) this.chanceOfRain.textContent = `${tomorrow.day.daily_chance_of_rain || 0}%`;
            if (this.sunrise) this.sunrise.textContent = this.formatTime(tomorrow.astro.sunrise);
            if (this.sunset) this.sunset.textContent = this.formatTime(tomorrow.astro.sunset);
            if (this.maxWind) this.maxWind.textContent = this.state.isCelsius ? `${tomorrow.day.maxwind_kph} km/h` : `${tomorrow.day.maxwind_mph} mph`;
            if (this.avgHumidity) this.avgHumidity.textContent = `${tomorrow.day.avghumidity}%`;
        }

        // Show weather alerts if any
        this.updateWeatherAlerts(this.state.forecastData.alerts);

        // Show weather content
        if (this.weatherContent) {
            this.weatherContent.classList.remove('hidden');
        }
    }

    updateAirQuality(index) {
        if (!this.airQuality) return;

        const qualityMap = {
            1: { text: 'Good', class: 'good' },
            2: { text: 'Moderate', class: 'moderate' },
            3: { text: 'Unhealthy for Sensitive', class: 'moderate' },
            4: { text: 'Unhealthy', class: 'poor' },
            5: { text: 'Very Unhealthy', class: 'poor' },
            6: { text: 'Hazardous', class: 'poor' }
        };

        const quality = qualityMap[index] || qualityMap[1];
        this.airQuality.textContent = quality.text;
        this.airQuality.className = `detail-value air-quality ${quality.class}`;
    }

    updateWeatherAlerts(alerts) {
        if (!this.weatherAlerts || !this.alertContent) return;

        if (alerts && alerts.alert && alerts.alert.length > 0) {
            const alertsHtml = alerts.alert.map(alert => 
                `<div class="alert-item">
                    <h5>${alert.headline}</h5>
                    <p>${alert.desc}</p>
                </div>`
            ).join('');
            
            this.alertContent.innerHTML = alertsHtml;
            this.weatherAlerts.classList.remove('hidden');
        } else {
            this.weatherAlerts.classList.add('hidden');
        }
    }

    updateWeatherTheme() {
        if (!this.state.currentWeather || !this.app) return;

        const condition = this.state.currentWeather.current.condition.code;
        const isDay = this.state.currentWeather.current.is_day;
        
        // Remove existing theme classes
        this.app.classList.remove('weather-theme-sunny', 'weather-theme-cloudy', 'weather-theme-rainy', 'weather-theme-night');
        
        let themeClass = 'weather-theme-cloudy';
        
        if (!isDay) {
            themeClass = 'weather-theme-night';
        } else if (condition === 1000) {
            themeClass = 'weather-theme-sunny';
        } else if ([1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246, 1273, 1276].includes(condition)) {
            themeClass = 'weather-theme-rainy';
        }
        
        this.app.classList.add(themeClass);
    }

    toggleUnits() {
        if (this.unitToggle) {
            this.unitToggle.classList.add('switching');
        }
        
        setTimeout(() => {
            this.state.isCelsius = !this.state.isCelsius;
            this.updateUnitToggle();
            if (this.state.currentWeather) {
                this.updateWeatherDisplay();
            }
            this.savePreferences();
            
            if (this.unitToggle) {
                this.unitToggle.classList.remove('switching');
            }
        }, 150);
    }

    updateUnitToggle() {
        if (this.unitToggle) {
            this.unitToggle.textContent = this.state.isCelsius ? '°C' : '°F';
        }
    }

    async useCurrentLocation() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            return;
        }

        if (this.locationBtn) {
            this.locationBtn.textContent = 'Getting location...';
            this.locationBtn.disabled = true;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    enableHighAccuracy: true
                });
            });

            const { latitude, longitude } = position.coords;
            await this.fetchWeatherData(`${latitude},${longitude}`);
            
        } catch (error) {
            console.error('Geolocation error:', error);
            alert('Unable to get your location. Please search for a city manually.');
        } finally {
            if (this.locationBtn) {
                this.locationBtn.innerHTML = '<span class="location-icon">📍</span>Use My Location';
                this.locationBtn.disabled = false;
            }
        }
    }

    retryWeatherFetch() {
        this.fetchWeatherData(this.state.currentCity);
    }

    formatTemperature(celsius, fahrenheit) {
        const temp = this.state.isCelsius ? Math.round(celsius) : Math.round(fahrenheit);
        const unit = this.state.isCelsius ? '°C' : '°F';
        return `${temp}${unit}`;
    }

    formatDateTime(dateTimeStr) {
        try {
            const date = new Date(dateTimeStr);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return dateTimeStr;
        }
    }

    formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateStr;
        }
    }

    formatTime(timeStr) {
        try {
            const date = new Date(`1970-01-01 ${timeStr}`);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return timeStr;
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherApp();
});

// Also initialize if DOM is already ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.weatherApp = new WeatherApp();
}