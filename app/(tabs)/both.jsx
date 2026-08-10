import { View , Pressable , Button , Image , ScrollView , Text , StyleSheet, Share, Alert, TextInput, Modal, TouchableOpacity } from 'react-native' 
import { CameraView , useCameraPermissions } from 'expo-camera'
import { useState , useRef, useEffect } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
    const [filterMode, setFilterMode] = useState('all'); // 'all' | 'favorites'
    const [editingItem, setEditingItem] = useState(null); // { id, title }
    const [newTitleText, setNewTitleText] = useState('');
    const cameraRef = useRef(null) ; 

    async function toggleFavorite (id) {
        try {
            const updatedJournal = journal.map(item => {
                if (item.id === id) {
                    return { ...item, isFavorite: !item.isFavorite } ; 
                }
                return item;
            });
            setJournal(updatedJournal);
            await AsyncStorage.setItem('travel_journal', JSON.stringify(updatedJournal));
        } catch (e) {
            console.log("Failed to toggle favorite", e);
        }
    }

    async function deleteEntry (id) {
        Alert.alert(
            "Delete Entry",
            "Are you sure you want to delete this journal entry?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const updatedJournal = journal.filter(item => item.id !== id); 
                            setJournal(updatedJournal);
                            await AsyncStorage.setItem('travel_journal', JSON.stringify(updatedJournal));
                        } catch (e) {
                            console.log("Delete failed", e);
                        }
                    }
                }
            ]
        );
    }

    async function renameEntry () {
        if (!editingItem) return;
        try {
            const updatedJournal = journal.map(item => {
                if (item.id === editingItem.id) {
                    return { ...item, title: newTitleText.trim() || "Untitled Photo" };
                }
                return item;
            }); 
            setJournal(updatedJournal); 
            await AsyncStorage.setItem('travel_journal', JSON.stringify(updatedJournal)); 
            setEditingItem(null); 
            setNewTitleText(''); 
        } catch (e) {
            console.log("Rename failed", e); 
        }
    }

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
                timestamp: time || new Date().toLocaleString(),
                title: "Photo " + new Date().toLocaleDateString(),
                isFavorite: false
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
                    lat = loc.coords.latitude ; 
                    lon = loc.coords.longitude ; 
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

                    {/* Filter Tab Bar */}
                    <View style={styles.filterBar}>
                        <TouchableOpacity 
                            style={[styles.filterButton, filterMode === 'all' && styles.filterButtonActive]}
                            onPress={() => setFilterMode('all')}
                        >
                            <Text style={[styles.filterButtonText, filterMode === 'all' && styles.filterButtonTextActive]}>
                                All ({journal.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.filterButton, filterMode === 'favorites' && styles.filterButtonActive]}
                            onPress={() => setFilterMode('favorites')}
                        >
                            <Text style={[styles.filterButtonText, filterMode === 'favorites' && styles.filterButtonTextActive]}>
                                Favorites ({journal.filter(item => item.isFavorite).length})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {journal
                        .filter(item => filterMode === 'all' || item.isFavorite)
                        .map((item) => (
                            <View key={item.id} style={styles.journalItem}>
                                <Image source={{ uri: item.uri }} style={styles.journalThumb} />
                                <View style={styles.journalDetails}>
                                    <View style={styles.journalTitleRow}>
                                        <Text style={styles.journalTitle} numberOfLines={1}>
                                            {item.title || "Untitled Photo"}
                                        </Text>
                                        <TouchableOpacity onPress={() => { setEditingItem(item); setNewTitleText(item.title || ''); }} style={styles.iconButton}>
                                            <MaterialIcons name="edit" size={16} color="#007AFF" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.journalDate}>{item.timestamp}</Text>
                                    {item.coords && (
                                        <Text style={styles.journalCoords}>Lat: {item.coords.latitude.toFixed(4)}, Lon: {item.coords.longitude.toFixed(4)}</Text>
                                    )}
                                    <Text style={styles.journalAddr} numberOfLines={2}>{item.address}</Text>
                                </View>
                                <View style={styles.journalActionsSide}>
                                    <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.actionIconBtn}>
                                        <MaterialIcons 
                                            name={item.isFavorite ? "favorite" : "favorite-border"} 
                                            size={24} 
                                            color={item.isFavorite ? "#FF3B30" : "#8E8E93"} 
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => deleteEntry(item.id)} style={styles.actionIconBtn}>
                                        <MaterialIcons name="delete" size={24} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    }
                </View>
            </ScrollView>

            {/* Rename Modal */}
            <Modal
                visible={editingItem !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEditingItem(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Rename Photo</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={newTitleText}
                            onChangeText={setNewTitleText}
                            placeholder="Enter photo title"
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonCancel]} 
                                onPress={() => setEditingItem(null)}
                            >
                                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonSave]} 
                                onPress={renameEntry}
                            >
                                <Text style={styles.modalButtonTextSave}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        fontWeight: 'bold',
        marginTop: 2
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
    },
    filterBar: {
        flexDirection: 'row',
        marginBottom: 15,
        backgroundColor: '#eee',
        borderRadius: 8,
        padding: 3
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6
    },
    filterButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1
    },
    filterButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500'
    },
    filterButtonTextActive: {
        color: '#000',
        fontWeight: 'bold'
    },
    journalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2
    },
    journalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        maxWidth: '85%'
    },
    iconButton: {
        marginLeft: 6,
        padding: 4
    },
    journalActionsSide: {
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingLeft: 10,
        borderLeftWidth: 1,
        borderLeftColor: '#f0f0f0'
    },
    actionIconBtn: {
        padding: 6
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center'
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 10,
        marginBottom: 20,
        fontSize: 16
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center'
    },
    modalButtonCancel: {
        backgroundColor: '#f5f5f5',
        marginRight: 10
    },
    modalButtonSave: {
        backgroundColor: '#007AFF',
        marginLeft: 10
    },
    modalButtonTextCancel: {
        color: '#333',
        fontWeight: '600'
    },
    modalButtonTextSave: {
        color: '#fff',
        fontWeight: '600'
    }
})
