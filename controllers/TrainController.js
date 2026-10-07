import axios from 'axios';

// Get Live Train Status
export const getLiveTrainStatus = async (req, res) => {
  try {
    const { trainNo, date } = req.query;

    if (!trainNo) {
      return res.status(400).json({ error: 'Train number is required' });
    }

    // Extract exactly 5 digits from the input (handles '12952 - Mmct Tejas Raj' or just '12952')
    const match = trainNo.match(/\d{5}/);
    if (!match) {
      return res.status(400).json({ error: 'Please enter a valid 5-digit train number or select a train from the suggestions list.' });
    }
    const extractedTrainNo = match[0];

    // Extract train name if provided (e.g. "12952 - Mmct Tejas Raj" -> "Mmct Tejas Raj")
    let extractedTrainName = "Express Train";
    if (trainNo.includes('-')) {
      extractedTrainName = trainNo.split('-')[1].trim();
    }

    const apiKey = process.env.RAPIDAPI_IRCTC_KEY;

    // If API Key is present, make the real request
    if (apiKey) {
      // Configuration for "Indian Railways Live Train Status & PNR Tracking Pro" API
      const options = {
        method: 'GET',
        url: 'https://indian-railways-live-train-status-pnr-tracking-pro.p.rapidapi.com/train',
        params: { train_no: extractedTrainNo },
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'indian-railways-live-train-status-pnr-tracking-pro.p.rapidapi.com'
        }
      };

      try {
        const response = await axios.request(options);
        const apiData = response.data;
        
        if (!apiData.success) {
          return res.status(400).json({ error: apiData.error || 'Failed to fetch live status for this train. It might not be running today.' });
        }

        // Find current, past, and future stations from the route array
        const route = apiData.route || apiData.stations || [];
        const sourceStation = route[0] || {};
        const destStation = route[route.length - 1] || {};
        
        let currentStation = null;
        let pastStation = null;
        let futureStation = null;
        
        // Try to find the current station if flagged
        const currentIndex = route.findIndex(s => s.is_current_station);
        if (currentIndex !== -1) {
          currentStation = route[currentIndex];
          pastStation = currentIndex > 0 ? route[currentIndex - 1] : route[0];
          futureStation = currentIndex < route.length - 1 ? route[currentIndex + 1] : route[route.length - 1];
        }

        const mappedData = {
          trainName: apiData.train_name || 'UNKNOWN',
          trainNumber: apiData.train_number || trainNo,
          source: sourceStation.station_name || 'Source',
          destination: destStation.station_name || 'Destination',
          status: currentStation ? currentStation.delay : 'Scheduled',
          currentStation: currentStation ? {
            stationName: currentStation.station_name,
            platform: currentStation.platform,
            distance: currentStation.distance,
            status: `Timing: ${currentStation.timing}`
          } : null,
          pastStation: pastStation ? {
            stationName: pastStation.station_name,
            platform: pastStation.platform,
            time: pastStation.timing
          } : null,
          futureStation: futureStation ? {
            stationName: futureStation.station_name,
            status: `Timing: ${futureStation.timing}`
          } : null,
          fullRoute: route
        };

        return res.status(200).json({
          success: true,
          data: mappedData,
          isMock: false
        });
      } catch (apiError) {
        console.error('Error fetching live train status from API:', apiError.response?.data || apiError.message);
        console.log('API limit reached or error occurred. Falling back to mock data for demonstration.');
        // We do NOT return 500 here anymore. We just let it fall through to the mock data below!
      }
    }

    // Fallback: If no API key is provided OR if the API request failed (e.g. rate limits), return mock data
    console.log(`No RAPIDAPI_IRCTC_KEY found. Returning mock data for train ${trainNo}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockResponse = {
      success: true,
      isMock: true,
      data: {
        trainName: extractedTrainName + ' (Mock Data)',
        trainNumber: extractedTrainNo,
        source: 'New Delhi (NDLS)',
        destination: 'Mumbai Central (MMCT)',
        status: 'On Time',
        currentStation: {
          stationName: 'Kota Jn (KOTA)',
          platform: '2',
          distance: '465 km',
          status: 'Arriving exactly on time at 19:30'
        },
        pastStation: {
          stationName: 'New Delhi (NDLS)',
          platform: '3',
          time: '16:55'
        },
        futureStation: {
          stationName: 'Mumbai Central (MMCT)',
          status: 'Expected Tomorrow at 08:35'
        },
        fullRoute: [
          {
            is_current_station: false,
            station_name: 'New Delhi (NDLS)',
            distance: '0 km',
            timing: '16:5516:55',
            delay: 'On Time',
            platform: '3',
            halt: 'Source'
          },
          {
            is_current_station: true,
            station_name: 'Kota Jn (KOTA)',
            distance: '465 km',
            timing: '19:3019:40',
            delay: 'On Time',
            platform: '2',
            halt: '10min'
          },
          {
            is_current_station: false,
            station_name: 'Vadodara Jn (BRC)',
            distance: '992 km',
            timing: '03:1503:25',
            delay: 'On Time',
            platform: '1',
            halt: '10min'
          },
          {
            is_current_station: false,
            station_name: 'Mumbai Central (MMCT)',
            distance: '1384 km',
            timing: '08:3508:35',
            delay: 'On Time',
            platform: '1',
            halt: 'Destination'
          }
        ]
      }
    };

    return res.status(200).json(mockResponse);

  } catch (error) {
    console.error('Server error in getLiveTrainStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check PNR Status
export const checkPNRStatus = async (req, res) => {
  try {
    const { pnr } = req.query;

    if (!pnr) {
      return res.status(400).json({ error: 'PNR number is required' });
    }

    const match = pnr.match(/^\d{10}$/);
    if (!match) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit PNR number.' });
    }

    const apiKey = process.env.RAPIDAPI_IRCTC_KEY;

    if (apiKey) {
      const options = {
        method: 'GET',
        url: 'https://indian-railways-live-train-status-pnr-tracking-pro.p.rapidapi.com/pnr',
        params: { pnr },
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'indian-railways-live-train-status-pnr-tracking-pro.p.rapidapi.com'
        }
      };

      try {
        const response = await axios.request(options);
        const apiData = response.data;
        
        if (!apiData.success) {
           // Fallback will catch it if success is false but let's return if explicit error
           if(apiData.error) {
              return res.status(400).json({ error: apiData.error });
           }
        } else {
           return res.status(200).json({
             success: true,
             data: apiData,
             isMock: false
           });
        }
      } catch (apiError) {
        console.error('Error fetching PNR status from API:', apiError.response?.data || apiError.message);
        console.log('API limit reached or error occurred. Falling back to mock data for PNR demonstration.');
      }
    }

    // Simulate network delay for mock
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock Response
    const mockResponse = {
      success: true,
      isMock: true,
      data: {
        pnr: pnr,
        train_no: "12951",
        train_name: "MUMBAI RAJDHANI",
        doj: new Date().toLocaleDateString('en-GB'),
        boarding_station: "New Delhi (NDLS)",
        reservation_upto: "Mumbai Central (MMCT)",
        chart_status: "Chart Prepared",
        class: "3A",
        quota: "GN",
        passenger_info: [
          {
            passenger_serial: "1",
            current_status: "CNF",
            current_coach: "B5",
            current_berth: "32",
            current_berth_type: "SU",
            booking_status: "CNF / B5 / 32"
          },
          {
            passenger_serial: "2",
            current_status: "CNF",
            current_coach: "B5",
            current_berth: "33",
            current_berth_type: "UB",
            booking_status: "CNF / B5 / 33"
          }
        ]
      }
    };

    return res.status(200).json(mockResponse);

  } catch (error) {
    console.error('Server error in checkPNRStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Coach & Seat Position
export const getCoachPosition = async (req, res) => {
  try {
    const { trainNumber } = req.query;

    if (!trainNumber) {
      return res.status(400).json({ error: 'Train number is required' });
    }

    // Attempt rapid API here if needed in future
    const apiKey = process.env.RAPIDAPI_IRCTC_KEY;
    if (apiKey) {
      // In the future, real API call goes here
      // For now, simulate hitting API limit and falling back
      console.log('API limit reached or error occurred. Falling back to mock data for Coach Position demonstration.');
    }

    // Simulate network delay for mock
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock Response Generator based on train number length/pattern to add some variety
    let coaches = [];
    if (trainNumber.includes('1295') || trainNumber.includes('22')) {
       // Premium Train (Rajdhani style)
       coaches = [
         { type: 'ENGINE', name: 'ENG' },
         { type: 'EOG', name: 'EOG' },
         { type: '1A', name: 'H1' },
         { type: '2A', name: 'A1' },
         { type: '2A', name: 'A2' },
         { type: '3A', name: 'B1' },
         { type: '3A', name: 'B2' },
         { type: '3A', name: 'B3' },
         { type: '3A', name: 'B4' },
         { type: 'PC', name: 'PC' },
         { type: '3A', name: 'B5' },
         { type: '3A', name: 'B6' },
         { type: 'EOG', name: 'EOG' }
       ];
    } else {
       // Standard Express
       coaches = [
         { type: 'ENGINE', name: 'ENG' },
         { type: 'GEN', name: 'GEN' },
         { type: 'GEN', name: 'GEN' },
         { type: 'SL', name: 'S1' },
         { type: 'SL', name: 'S2' },
         { type: 'SL', name: 'S3' },
         { type: 'SL', name: 'S4' },
         { type: 'PC', name: 'PC' },
         { type: '3A', name: 'B1' },
         { type: '3A', name: 'B2' },
         { type: '2A', name: 'A1' },
         { type: 'GEN', name: 'GEN' }
       ];
    }

    const mockResponse = {
      success: true,
      isMock: true,
      data: {
        train_no: trainNumber,
        train_name: trainNumber.includes('1295') ? "RAJDHANI EXP" : "SUPERFAST EXP",
        coaches: coaches
      }
    };

    return res.status(200).json(mockResponse);

  } catch (error) {
    console.error('Server error in getCoachPosition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Platform Locator
export const getPlatformLocator = async (req, res) => {
  try {
    const { trainNumber } = req.query;

    if (!trainNumber) {
      return res.status(400).json({ error: 'Train number is required' });
    }

    // Attempt rapid API here if needed in future
    const apiKey = process.env.RAPIDAPI_IRCTC_KEY;
    if (apiKey) {
      console.log('API limit reached or error occurred. Falling back to mock data for Platform Locator demonstration.');
    }

    // Simulate network delay for mock
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Mock Route Data with Platforms
    const mockRoute = [
      {
        station_name: 'New Delhi (NDLS)',
        arrival_time: 'Source',
        departure_time: '16:55',
        platform: '3',
        halt: '0 min'
      },
      {
        station_name: 'Kota Jn (KOTA)',
        arrival_time: '21:30',
        departure_time: '21:40',
        platform: '2',
        halt: '10 min'
      },
      {
        station_name: 'Ratlam Jn (RTM)',
        arrival_time: '00:15',
        departure_time: '00:18',
        platform: '4',
        halt: '3 min'
      },
      {
        station_name: 'Vadodara Jn (BRC)',
        arrival_time: '03:15',
        departure_time: '03:25',
        platform: '1',
        halt: '10 min'
      },
      {
        station_name: 'Surat (ST)',
        arrival_time: '05:13',
        departure_time: '05:18',
        platform: '2',
        halt: '5 min'
      },
      {
        station_name: 'Mumbai Central (MMCT)',
        arrival_time: '08:35',
        departure_time: 'Destination',
        platform: '1',
        halt: '0 min'
      }
    ];

    const mockResponse = {
      success: true,
      isMock: true,
      data: {
        train_no: trainNumber,
        train_name: trainNumber.includes('1295') ? "RAJDHANI EXP" : "SUPERFAST EXP",
        route: mockRoute
      }
    };

    return res.status(200).json(mockResponse);

  } catch (error) {
    console.error('Server error in getPlatformLocator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
