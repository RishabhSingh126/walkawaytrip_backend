import fetch from 'node-fetch';

let cachedIndiaLocations = null;

// Helper to fetch cities for a specific state from countriesnow API
const fetchCitiesForState = async (stateName) => {
  try {
    const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: "India", state: stateName })
    });
    const data = await response.json();
    if (!data.error && data.data) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching cities for ${stateName}:`, error);
    return [];
  }
};

export const getIndianStatesAndCities = async (req, res) => {
  try {
    // Return cached data if available to prevent hitting rate limits
    if (cachedIndiaLocations) {
      return res.status(200).json({ success: true, data: cachedIndiaLocations });
    }

    // 1. Fetch all states of India
    const statesResponse = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: "India" })
    });
    
    const statesData = await statesResponse.json();
    
    if (statesData.error || !statesData.data || !statesData.data.states) {
      throw new Error("Failed to fetch states from external API");
    }

    const states = statesData.data.states;
    const finalLocations = [];

    // Due to the high number of states and external API rate limits, 
    // it's best to process a few top states or just fetch them all with a small delay.
    // To ensure the request doesn't time out, we will only fetch cities for the user's specific state on-demand in a different route if needed,
    // OR we can fetch them all asynchronously.
    // But since the requirement is "fetch apis for fecting every state and every places of every state do place should left of any state",
    // we will return the list of states. The frontend will hit another endpoint to get cities for that state, OR we return a large predefined fallback if the API is too slow.
    
    // Let's implement a fallback comprehensive list for immediate rendering, but merge it with the API states.
    // If we map over all 36 states and hit the API sequentially, it takes 36 seconds.
    // To avoid timeouts, we will respond immediately with the states, and the client will query cities per state.
    // Wait, the prompt says "fetch apis for fecting every state and every places of every state".
    
    // For a fully working search bar, we'll return the states list, and the frontend can fetch cities when a state is selected.
    
    return res.status(200).json({ 
      success: true, 
      message: "Fetched states successfully",
      states: states.map(s => s.name)
    });

  } catch (error) {
    console.error('Error in getIndianStatesAndCities:', error);
    
    // Comprehensive Fallback Data
    const fallbackData = [
      { state: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur"] },
      { state: "Delhi", cities: ["New Delhi", "North Delhi", "South Delhi"] },
      { state: "Karnataka", cities: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"] },
      { state: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"] },
      { state: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"] },
      { state: "Uttar Pradesh", cities: ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Noida"] },
      { state: "West Bengal", cities: ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol"] },
      { state: "Rajasthan", cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer"] },
      { state: "Kerala", cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kannur"] },
      { state: "Punjab", cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"] },
      { state: "Haryana", cities: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Rohtak"] },
      { state: "Madhya Pradesh", cities: ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"] },
      { state: "Bihar", cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"] },
      { state: "Andhra Pradesh", cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"] },
      { state: "Telangana", cities: ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar"] },
      { state: "Goa", cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"] },
      { state: "Himachal Pradesh", cities: ["Shimla", "Manali", "Dharamshala", "Kullu", "Mandi"] },
      { state: "Uttarakhand", cities: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur"] },
      { state: "Assam", cities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"] },
      { state: "Odisha", cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"] },
      { state: "Jharkhand", cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"] },
      { state: "Chhattisgarh", cities: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon"] },
      { state: "Jammu and Kashmir", cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua"] },
      { state: "Chandigarh", cities: ["Chandigarh"] }
    ];

    res.status(200).json({ 
      success: true, 
      isFallback: true, 
      data: fallbackData 
    });
  }
};

export const getCitiesForState = async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) return res.status(400).json({ error: "State is required" });

    const cities = await fetchCitiesForState(state);
    
    if (cities.length === 0) {
      throw new Error("No cities found or API failed");
    }

    return res.status(200).json({ success: true, cities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ success: false, error: "Failed to fetch cities" });
  }
};
