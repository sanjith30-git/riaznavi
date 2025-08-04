export const translations = {
  tamil: {
    welcome: "வணக்கம்! நான் உங்கள் கல்லூரி வழிகாட்டி. எந்த இடத்திற்கு செல்ல விரும்புகிறீர்கள்?",
    selectDestination: "உங்கள் இலக்கை தேர்ந்தெடுக்கவும்:",
    calculating: "சரியாக! நான் உங்களை {destination} க்கு அழைத்துச் செல்கிறேன். உங்கள் பாதையை இப்போது கணக்கிடுகிறேன்...",
    routeCalculated: "பாதை கணக்கிடப்பட்டது! தூரம்: {distance}, மதிப்பிடப்பட்ட நேரம்: {duration}. இப்போது நான் திருப்பம் மூலம் திருப்பம் வழிகாட்டுதல்களை வழங்குவேன்.",
    navigationStarted: "வழிசெலுத்தல் தொடங்கியது.",
    turnLeft: "இடதுபுறம் திரும்பவும்",
    turnRight: "வலதுபுறம் திரும்பவும்",
    goStraight: "நேராக செல்லுங்கள்",
    followMe: "என்னைப் பின்தொடர்ந்து வாருங்கள்",
    destinationReached: "நீங்கள் உங்கள் இலக்கை அடைந்துவிட்டீர்கள்!",
    newDestination: "புதிய இலக்கு",
    arMode: "AR வழிசெலுத்தல்",
    enableCamera: "கேமராவை இயக்கவும்",
    language: "மொழி",
    listening: "கேட்கிறது...",
    speaking: "பேசுகிறது...",
    ready: "உதவ தயார்!",
    cameraError: "கேமரா அணுகல் பிழை. தயவுசெய்து அனுமதிகளை சரிபார்க்கவும்.",
    speechNotSupported: "மன்னிக்கவும், உங்கள் சாதனத்தில் பேச்சு அங்கீகாரம் ஆதரிக்கப்படவில்லை. இலக்கை தேர்ந்தெடுக்க பொத்தான்களைப் பயன்படுத்தவும்.",
    didNotCatch: "நீங்கள் எந்த கட்டிடத்தைத் தேடுகிறீர்கள் என்பதை நான் புரிந்து கொள்ளவில்லை. கீழே உள்ள விருப்பங்களிலிருந்து தேர்ந்தெடுக்கவும் அல்லது தெளிவாக பேசவும்.",
    helpMore: "இன்று கல்லூரியில் வழிசெலுத்த நான் வேறு எப்படி உதவ முடியும்?"
  },
  english: {
    welcome: "Hello! I'm your campus guide. Where would you like to go today?",
    selectDestination: "Select Your Destination:",
    calculating: "Perfect! I'll guide you to {destination}. {description} Calculating your route now...",
    routeCalculated: "Route calculated! Distance: {distance}, estimated time: {duration}. I'll now provide turn-by-turn directions.",
    navigationStarted: "Navigation started.",
    turnLeft: "Turn left",
    turnRight: "Turn right",
    goStraight: "Continue straight",
    followMe: "Follow me",
    destinationReached: "You have reached your destination!",
    newDestination: "New Destination",
    arMode: "AR Navigation",
    enableCamera: "Enable Camera",
    language: "Language",
    listening: "Listening...",
    speaking: "Speaking...",
    ready: "Ready to help you navigate!",
    cameraError: "Camera access error. Please check permissions.",
    speechNotSupported: "Sorry, speech recognition is not supported on your device. Please use the buttons to select your destination.",
    didNotCatch: "I didn't catch which building you're looking for. Could you please select from the options below or speak more clearly?",
    helpMore: "How else can I help you navigate the campus today?"
  },
  navigationInstructions: {
    tamil: {
      turnLeft: "இடதுபுறம் திரும்பவும்",
      turnRight: "வலதுபுறம் திரும்பவும்",
      goStraight: "நேராக செல்லுங்கள்",
      continueWalking: "தொடர்ந்து நடக்கவும்",
      nearDestination: "இலக்கு அருகில் உள்ளது",
      destinationAhead: "இலக்கு முன்னால் உள்ளது"
    },
    english: {
      turnLeft: "Turn left",
      turnRight: "Turn right", 
      goStraight: "Go straight",
      continueWalking: "Continue walking",
      nearDestination: "Destination is near",
      destinationAhead: "Destination ahead"
    }
  }
};

export const getTranslation = (key: string, language: 'tamil' | 'english', replacements?: Record<string, string>): string => {
  let text = translations[language][key as keyof typeof translations.tamil] || key;
  
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(`{${placeholder}}`, value);
    });
  }
  
  return text;
};