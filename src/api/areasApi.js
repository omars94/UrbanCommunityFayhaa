import database from '@react-native-firebase/database';

export const fetchAreas = async () => {
    try {
        console.log("fetching areas...");
        const snapshot = await database().ref('/areas').once('value');
        // RTDB returns data as an object, convert to array
        console.log(snapshot.val());
        return snapshot.val() ? Object.values(snapshot.val()) : [];
    } catch (error) {
        console.log("areas fetch failed:", error);
        throw error;
    }
}

export const getMunicipalityByAreaId = async (areaId) => {
    try {const snapshot = await database().ref(`/areas/${areaId}`).once('value');
        console.log("fetched area:", snapshot.val());
        return snapshot.val() ? snapshot.val().municipality_id : null;
    } catch (error) {
        console.log("get municipality failed:", error);
        throw error;
    }
}