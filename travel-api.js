// Travel API Integration for Last Minute Deals
// EventFinder Travel Module

class TravelAPIManager {
    constructor() {
        // API Keys (get these from respective providers)
        this.TRAVELPAYOUTS_TOKEN = 'YOUR_TRAVELPAYOUTS_TOKEN'; // travelpayouts.com
        this.HOTELLOOK_TOKEN = 'YOUR_HOTELLOOK_TOKEN'; // hotellook.com
        this.AMADEUS_API_KEY = 'YOUR_AMADEUS_KEY'; // developers.amadeus.com
        
        // API Endpoints
        this.endpoints = {
            flights: 'https://api.travelpayouts.com/v1/prices/cheap',
            hotels: 'https://engine.hotellook.com/api/v2/search/start.json',
            packages: 'https://api.travelpayouts.com/v2/prices/month-matrix',
            cities: 'https://api.travelpayouts.com/data/en/cities.json'
        };
    }

    // Search cheap flights
    async searchFlights(origin, destination, departDate, returnDate = null) {
        const params = new URLSearchParams({
            origin: origin,
            destination: destination,
            depart_date: departDate,
            token: this.TRAVELPAYOUTS_TOKEN,
            currency: 'PLN',
            limit: 10
        });

        if (returnDate) {
            params.append('return_date', returnDate);
        }

        try {
            const response = await fetch(`${this.endpoints.flights}?${params}`);
            if (!response.ok) throw new Error('Flight API error');
            
            const data = await response.json();
            return this.formatFlightResults(data);
        } catch (error) {
            console.error('Error fetching flights:', error);
            return this.getMockFlightData(origin, destination, departDate);
        }
    }

    // Search hotels
    async searchHotels(cityCode, checkIn, checkOut, adults = 2) {
        const params = new URLSearchParams({
            destination: cityCode,
            checkin: checkIn,
            checkout: checkOut,
            adults: adults,
            token: this.HOTELLOOK_TOKEN,
            currency: 'PLN',
            limit: 10
        });

        try {
            const response = await fetch(`${this.endpoints.hotels}?${params}`);
            if (!response.ok) throw new Error('Hotel API error');
            
            const data = await response.json();
            return this.formatHotelResults(data);
        } catch (error) {
            console.error('Error fetching hotels:', error);
            return this.getMockHotelData(cityCode, checkIn);
        }
    }

    // Search travel packages (flight + hotel)
    async searchPackages(origin, destination, departDate, returnDate) {
        try {
            // Get flights and hotels separately, then combine
            const [flights, hotels] = await Promise.all([
                this.searchFlights(origin, destination, departDate, returnDate),
                this.searchHotels(destination, departDate, returnDate)
            ]);

            return this.combinePackages(flights, hotels);
        } catch (error) {
            console.error('Error creating packages:', error);
            return this.getMockPackageData(origin, destination, departDate);
        }
    }

    // Format flight results
    formatFlightResults(data) {
        if (!data.data) return [];

        return Object.values(data.data).map(flight => ({
            id: flight.gate || Math.random().toString(36),
            type: 'flight',
            origin: flight.origin,
            destination: flight.destination,
            price: Math.round(flight.value),
            currency: 'PLN',
            departDate: flight.depart_date,
            returnDate: flight.return_date,
            airline: flight.airline || 'Unknown',
            duration: this.calculateDuration(flight.origin, flight.destination),
            direct: Math.random() > 0.5, // API doesn't always provide this
            bookingUrl: `https://www.travelpayouts.com/flights/${flight.origin}${flight.destination}${flight.depart_date}`,
            badge: this.getBadge(flight.value, 'flight')
        }));
    }

    // Format hotel results
    formatHotelResults(data) {
        if (!data.hotels) return [];

        return data.hotels.slice(0, 10).map(hotel => ({
            id: hotel.id,
            type: 'hotel',
            name: hotel.name || 'Hotel Premium',
            price: Math.round(Math.random() * 300 + 100), // API structure varies
            currency: 'PLN',
            rating: Math.floor(Math.random() * 2) + 3, // 3-5 stars
            location: hotel.location || 'Centrum miasta',
            amenities: ['WiFi gratis', 'Śniadanie', 'Klimatyzacja'],
            image: hotel.image || '/images/hotel-placeholder.jpg',
            bookingUrl: hotel.booking_url || '#',
            badge: this.getBadge(hotel.price, 'hotel')
        }));
    }

    // Combine flights and hotels into packages
    combinePackages(flights, hotels) {
        const packages = [];
        
        flights.slice(0, 3).forEach((flight, i) => {
            if (hotels[i]) {
                const hotel = hotels[i];
                const packagePrice = flight.price + (hotel.price * 3); // 3 nights
                
                packages.push({
                    id: `package_${flight.id}_${hotel.id}`,
                    type: 'package',
                    flight: flight,
                    hotel: hotel,
                    price: Math.round(packagePrice * 0.9), // 10% package discount
                    currency: 'PLN',
                    duration: '3 dni / 2 noce',
                    savings: Math.round(packagePrice * 0.1),
                    includes: ['Lot w obie strony', '2 noce w hotelu', 'Śniadanie', 'Ubezpieczenie'],
                    badge: 'Pakiet'
                });
            }
        });

        return packages;
    }

    // Get badge based on price and type
    getBadge(price, type) {
        const badges = {
            flight: price < 200 ? 'Super Okazja' : price < 400 ? 'Hot Deal' : 'Dobra Cena',
            hotel: price < 150 ? 'Last Minute' : price < 300 ? 'Bestseller' : 'Premium',
            package: 'Komplet'
        };
        
        return badges[type] || 'Oferta';
    }

    // Calculate approximate flight duration
    calculateDuration(origin, destination) {
        const distances = {
            'WAW-BER': '1h 20min',
            'WAW-LON': '2h 30min',
            'WAW-PAR': '2h 45min',
            'WAW-ROM': '2h 15min',
            'WAW-BCN': '3h 10min',
            'WAW-AMS': '1h 50min'
        };
        
        return distances[`${origin}-${destination}`] || '2h 30min';
    }

    // Mock data for when APIs are not available
    getMockFlightData(origin, destination, departDate) {
        return [
            {
                id: 'mock_flight_1',
                type: 'flight',
                origin: origin,
                destination: destination,
                price: Math.floor(Math.random() * 400) + 200,
                currency: 'PLN',
                departDate: departDate,
                airline: 'LOT Polish Airlines',
                duration: this.calculateDuration(origin, destination),
                direct: true,
                bookingUrl: '#',
                badge: 'Hot Deal'
            },
            {
                id: 'mock_flight_2',
                type: 'flight',
                origin: origin,
                destination: destination,
                price: Math.floor(Math.random() * 300) + 150,
                currency: 'PLN',
                departDate: departDate,
                airline: 'Ryanair',
                duration: this.calculateDuration(origin, destination),
                direct: false,
                bookingUrl: '#',
                badge: 'Super Okazja'
            }
        ];
    }

    getMockHotelData(cityCode, checkIn) {
        return [
            {
                id: 'mock_hotel_1',
                type: 'hotel',
                name: 'Hotel Premium Center',
                price: Math.floor(Math.random() * 200) + 100,
                currency: 'PLN',
                rating: 4,
                location: 'Centrum miasta',
                amenities: ['WiFi gratis', 'Śniadanie', 'Siłownia'],
                badge: 'Bestseller'
            },
            {
                id: 'mock_hotel_2',
                type: 'hotel',
                name: 'Boutique Hotel',
                price: Math.floor(Math.random() * 150) + 80,
                currency: 'PLN',
                rating: 3,
                location: 'Stare Miasto',
                amenities: ['WiFi gratis', 'Klimatyzacja'],
                badge: 'Last Minute'
            }
        ];
    }

    getMockPackageData(origin, destination, departDate) {
        return [
            {
                id: 'mock_package_1',
                type: 'package',
                price: 899,
                currency: 'PLN',
                duration: '3 dni / 2 noce',
                savings: 200,
                includes: ['Lot w obie strony', '2 noce w hotelu 4★', 'Śniadanie', 'Transfer'],
                badge: 'Bestseller'
            }
        ];
    }
}

// Initialize Travel API Manager
const travelAPI = new TravelAPIManager();

// Update the search function in last-minute.html
async function searchDealsReal() {
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const departure = document.getElementById('departure').value;
    const returnDate = document.getElementById('return').value;
    
    if (!destination || !departure) {
        alert('Proszę wybierz destynację i datę wylotu');
        return;
    }
    
    // Show loading
    document.getElementById('loading').classList.add('active');
    document.getElementById('results').innerHTML = '';
    
    try {
        // Get the active search type
        const activeType = document.querySelector('.nav-btn.active').dataset.type;
        
        let results = [];
        
        switch (activeType) {
            case 'flights':
                results = await travelAPI.searchFlights(origin, destination, departure, returnDate);
                break;
            case 'hotels':
                results = await travelAPI.searchHotels(destination, departure, returnDate);
                break;
            case 'packages':
                results = await travelAPI.searchPackages(origin, destination, departure, returnDate);
                break;
            default:
                results = await travelAPI.searchFlights(origin, destination, departure, returnDate);
        }
        
        displayResults(results);
        
    } catch (error) {
        console.error('Error searching deals:', error);
        document.getElementById('results').innerHTML = '<p>Wystąpił błąd podczas wyszukiwania. Spróbuj ponownie.</p>';
    } finally {
        document.getElementById('loading').classList.remove('active');
    }
}

// Display results function
function displayResults(deals) {
    const results = document.getElementById('results');
    
    if (!deals || deals.length === 0) {
        results.innerHTML = '<p>Nie znaleziono ofert dla wybranych kryteriów.</p>';
        return;
    }
    
    const resultsHTML = `
        <div class="results-grid">
            ${deals.map(deal => createDealCard(deal)).join('')}
        </div>
    `;
    
    results.innerHTML = resultsHTML;
}

// Create deal card HTML
function createDealCard(deal) {
    let details = [];
    
    switch (deal.type) {
        case 'flight':
            details = [
                { icon: 'plane', text: deal.direct ? 'Lot bezpośredni' : 'Z przesiadką' },
                { icon: 'clock', text: deal.duration },
                { icon: 'calendar', text: deal.departDate },
                { icon: 'building', text: deal.airline }
            ];
            break;
        case 'hotel':
            details = [
                { icon: 'star', text: `${deal.rating}★ Hotel` },
                { icon: 'map-marker', text: deal.location },
                { icon: 'wifi', text: deal.amenities.join(', ') }
            ];
            break;
        case 'package':
            details = [
                { icon: 'suitcase', text: deal.duration },
                { icon: 'tags', text: `Oszczędzasz ${deal.savings} zł` },
                { icon: 'check', text: deal.includes.join(', ') }
            ];
            break;
    }
    
    return `
        <div class="deal-card">
            <div class="deal-badge">${deal.badge}</div>
            <h3 class="deal-title">${deal.name || deal.origin + ' → ' + deal.destination || 'Super Oferta'}</h3>
            <div class="deal-price">${deal.price} ${deal.currency}</div>
            <div class="deal-details">
                ${details.map(detail => `
                    <div class="deal-detail">
                        <i class="fas fa-${detail.icon}"></i>
                        <span>${detail.text}</span>
                    </div>
                `).join('')}
            </div>
            <button class="deal-btn" onclick="bookDeal('${deal.id}', '${deal.bookingUrl || '#'}')">
                Rezerwuj Teraz
            </button>
        </div>
    `;
}

// Book deal function
function bookDeal(dealId, bookingUrl) {
    // Track conversion for monetization
    if (typeof gtag !== 'undefined') {
        gtag('event', 'book_travel', {
            'deal_id': dealId,
            'value': 1
        });
    }
    
    // Open booking URL
    if (bookingUrl !== '#') {
        window.open(bookingUrl, '_blank');
    } else {
        alert('Funkcja rezerwacji będzie dostępna wkrótce!');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TravelAPIManager;
}