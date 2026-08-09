import { View , Pressable , Button , Image , ScrollView , Text , StyleSheet, Share, Alert } from 'react-native' 
import { CameraView , useCameraPermissions } from 'expo-camera'
import { useState , useRef, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as Location from "expo-location";
import MapView , { Marker } from "react-native-maps"
import AsyncStorage from '@react-native-async-storage/async-storage';

function Both () {
    const [cameraPermission , setcameraPermission] = useCameraPermissions() ; 
    const [img , setImg] = useState(null) ; 
    const [coords , setCoords] = useState(null) ; 
    const [time , setTime] = useState("") ; 
    const [address, setAddress] = useState("");
    const [journal, setJournal] = useState([]);
    const cameraRef = useRef(null) ; 

    useEffect(() => {
        loadJournal();
    }, []);

    async function loadJournal () {
        try {
            const savedData = await AsyncStorage.getItem('travel_journal');
            if (savedData) {
                setJournal(JSON.parse(savedData));
            }
        } catch (e) {
            console.log("Failed to load journal", e);
        }
    }

    async function saveToJournal () {
        if (!img) {
            Alert.alert("No Photo", "Please take a photo first.");
            return;
        }
        try {
            const newEntry = {
                id: Date.now().toString(),
                uri: img.uri,
                coords: coords,
                address: address || "No address details",
                timestamp: time || new Date().toLocaleString()
            };
            const updatedJournal = [newEntry, ...journal];
            setJournal(updatedJournal);
            await AsyncStorage.setItem('travel_journal', JSON.stringify(updatedJournal));
            Alert.alert("Saved!", "Entry added to your Travel Journal.");
        } catch (e) {
            console.log("Save failed", e);
            Alert.alert("Error", "Could not save entry.");
        }
    }

    async function clearJournal () {
        Alert.alert(
            "Clear Journal",
            "Are you sure you want to delete all entries?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('travel_journal');
                            setJournal([]);
                            Alert.alert("Deleted", "Travel journal cleared.");
                        } catch (e) {
                            console.log("Clear failed", e);
                        }
                    }
                }
            ]
        );
    }

    async function exportJournal () {
        if (journal.length === 0) {
            Alert.alert("Empty Journal", "No entries to export.");
            return;
        }
        try {
            const jsonString = JSON.stringify(journal, null, 2);
            await Share.share({
                message: jsonString,
                title: "Travel Journal Export"
            });
        } catch (e) {
            console.log("Export failed", e);
        }
    }

    if (cameraPermission?.granted == false) {
        return (
            <>
                <View>
                    <Text>
                        Camera permission is required.
                    </Text>
                </View>

                <Pressable style={{marginTop:50}} onPress={setcameraPermission}>
                    <Text>
                        Permition for camera
                    </Text>
                </Pressable>
            </>
        )
    }

    async function takePhoto () {
        if (cameraRef.current) {
            const locPermission = await Location.requestForegroundPermissionsAsync() ; 
            if(locPermission.granted) {
                const loc = await Location.getCurrentPositionAsync() ; 
                console.log("Captured Location: ", loc) ;
                setCoords(loc.coords) ;

                // Reverse geocoding to get address
                const add = await Location.reverseGeocodeAsync({
                    latitude : loc.coords.latitude , 
                    longitude : loc.coords.longitude
                }) ; 
                console.log("Captured Address: ", add) ;
                if (add && add.length > 0) {
                    const firstAdd = add[0];
                    const formattedAddress = `${firstAdd.name || ''}, ${firstAdd.street || ''}, ${firstAdd.city || ''}, ${firstAdd.region || ''}, ${firstAdd.country || ''} - ${firstAdd.postalCode || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',').trim();
                    setAddress(formattedAddress);
                }
            } else {
                console.log("Location permission denied") ; 
            }

            const photo = await cameraRef.current.takePictureAsync({
                quality: 1,
                shutterSound : false
            }) ; 
            console.log(photo) ; 
            setImg(photo) ; 
            setTime(new Date().toLocaleString()) ;
            await MediaLibrary.createAssetAsync(photo.uri) ; 
        }
    }

    async function sosEmergency () {
        if (cameraRef.current) {
            try {
                const locPermission = await Location.requestForegroundPermissionsAsync() ; 
                let lat = 0;
                let lon = 0;
                let addrStr = "Unknown Location";
                let currentTime = new Date().toLocaleString();

                if(locPermission.granted) {
                    const loc = await Location.getCurrentPositionAsync() ; 
                    lat = loc.coords.latitude;
                    lon = loc.coords.longitude;
                    setCoords(loc.coords) ;

                    const add = await Location.reverseGeocodeAsync({
                        latitude : lat , 
                        longitude : lon
                    }) ; 
                    if (add && add.length > 0) {
                        const firstAdd = add[0];
                        addrStr = `${firstAdd.name || ''}, ${firstAdd.street || ''}, ${firstAdd.city || ''}, ${firstAdd.region || ''}, ${firstAdd.country || ''} - ${firstAdd.postalCode || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',').trim();
                        setAddress(addrStr);
                    }
                }

                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.5,
                    shutterSound : true
                }) ; 
                setImg(photo) ; 
                setTime(currentTime) ;
                await MediaLibrary.createAssetAsync(photo.uri) ; 

                // Share emergency message
                await Share.share({
                    message : `EMERGENCY SOS!\nI need help. My current location is:\nMaps: https://maps.google.com/?q=${lat},${lon}\nAddress: ${addrStr}\nTime: ${currentTime}` , 
                    title : "EMERGENCY SOS"
                }) ;
            } catch (error) {
                console.log("SOS Error: ", error) ;
                Alert.alert("SOS Failed", "Something went wrong while sending SOS") ;
            }
        }
    }

    return (
        <>
            <ScrollView style={{ flex: 1 }}>
                <CameraView 
                    style={{width:"100%" , height:450 , marginTop:28}} 
                    ref={cameraRef} 
                />

                <Pressable style={styles.sosButton} onPress={sosEmergency}>
                    <Text style={styles.sosButtonText}>SEND SOS EMERGENCY</Text>
                </Pressable>

                <Button 
                    title={"Take image"}
                    onPress={takePhoto}
                />

                {
                    img &&
                    <View>
                        <Image  
                            source={{uri:img.uri}}
                            style={{width:"100%" , height:450}}
                        />
                        <Text style={{marginTop: 10, marginHorizontal: 10}}>URI: {img.uri}</Text>
                        {coords && (
                            <Text style={{marginTop: 5, marginHorizontal: 10}}>Coordinates: Lat {coords.latitude}, Lon {coords.longitude}</Text>
                        )}
                        {time && (
                            <Text style={{marginTop: 5, marginHorizontal: 10}}>Timestamp: {time}</Text>
                        )}
                        {address ? (
                            <Text style={{marginTop: 5, marginHorizontal: 10}}>Address: {address}</Text>
                        ) : null}

                        <Button 
                            title="Save to Travel Journal" 
                            onPress={saveToJournal} 
                        />

                        {coords && (
                            <View style={styles.mapContainer}>
                                <MapView 
                                    style={styles.map}
                                    mapType="hybrid"
                                    region={{
                                        latitude : coords.latitude , 
                                        longitude : coords.longitude , 
                                        latitudeDelta : 0.01 , 
                                        longitudeDelta : 0.01
                                    }}
                                >
                                    <Marker
                                        coordinate={{
                                            latitude : coords.latitude , 
                                            longitude : coords.longitude 
                                        }}
                                        title="Photo Location" 
                                    />
                                </MapView>
                                <View style={styles.watermark}>
                                    <Text style={styles.watermarkText}>Lat: {coords.latitude.toFixed(4)}</Text>
                                    <Text style={styles.watermarkText}>Lon: {coords.longitude.toFixed(4)}</Text>
                                    <Text style={styles.watermarkText}>{time}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                }

                {/* Travel Journal list section */}
                <View style={styles.journalContainer}>
                    <Text style={styles.journalHeader}>My Travel Journal</Text>
                    
                    {journal.length > 0 && (
                        <View style={styles.actionButtons}>
                            <Button title="Export Journal JSON" onPress={exportJournal} />
                            <View style={{height: 10}} />
                            <Button title="Clear Journal" color="gray" onPress={clearJournal} />
                        </View>
                    )}

                    {journal.map((item) => (
                        <View key={item.id} style={styles.journalItem}>
                            <Image source={{ uri: item.uri }} style={styles.journalThumb} />
                            <View style={styles.journalDetails}>
                                <Text style={styles.journalDate}>{item.timestamp}</Text>
                                {item.coords && (
                                    <Text style={styles.journalCoords}>Lat: {item.coords.latitude.toFixed(4)}, Lon: {item.coords.longitude.toFixed(4)}</Text>
                                )}
                                <Text style={styles.journalAddr} numberOfLines={2}>{item.address}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </>
    )
}

export default Both ;

const styles = StyleSheet.create({
    mapContainer: {
        position: 'relative',
        width: '100%',
        height: 300,
        marginTop: 15,
        marginBottom: 20
    },
    map: {
        width: '100%',
        height: '100%'
    },
    watermark: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 8,
        borderRadius: 5
    },
    watermarkText: {
        color: '#fff',
        fontSize: 11
    },
    sosButton: {
        backgroundColor: '#FF3B30',
        padding: 15,
        margin: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sosButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    journalContainer: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    journalHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center'
    },
    actionButtons: {
        marginBottom: 15
    },
    journalItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2
    },
    journalThumb: {
        width: 80,
        height: 80,
        borderRadius: 6
    },
    journalDetails: {
        flex: 1,
        marginLeft: 10,
        justifyContent: 'center'
    },
    journalDate: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold'
    },
    journalCoords: {
        fontSize: 11,
        color: '#444',
        marginTop: 2
    },
    journalAddr: {
        fontSize: 12,
        color: '#222',
        marginTop: 4
    }
})
