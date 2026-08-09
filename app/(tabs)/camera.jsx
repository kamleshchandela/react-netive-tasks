import { View , Pressable , Button , Image , ScrollView , Text } from 'react-native' 
import { CameraView , useCameraPermissions, useMicrophonePermissions } from 'expo-camera'
import { useState , useRef } from 'react';
import Slider from '@react-native-community/slider'
import { useReducer } from 'react'; 
import { VideoView , useVideoPlayer } from 'expo-video'
import * as MediaLibrary from 'expo-media-library';
import * as Linking from 'expo-linking';  
import * as Updates from 'expo-updates';




function Camera () {
    const [cameraPermission , setcameraPermission] = useCameraPermissions() ; 
    const [microphon , setMicrophon] = useMicrophonePermissions() ; 
    const [cameraFace , setCameraFace] = useState("back") ; 
    const [flash , setFlash] = useState("on") ; 
    const [zoom , setZoom] = useState(0) ; 
    const [img , setImg] = useState(null) ; 
    const [mode , setMode] = useState("picture") ; 
    const [video , setVideo] = useState(null) ; 
    const cameraRef = useRef(null) ; 
    const player = useVideoPlayer(video?.uri) ; 
    const [scannedData, setScannedData] = useState(null); 
    const [toarch , setToarch] = useState(false) ;  


    const handleBarcodeScanned = async (e) => {
        console.log(e) 
        setScannedData(e.data); 
        alert(e.type + " " + e.data + " " + "qrscane") ; 
        Linking.openURL(e.data); 
        await Updates.reloadAsync(); 
        // is data se koi website khol sakte hain ya server par bhej sakte hain
    };
    


    console.log(cameraPermission) ; 

    if(cameraPermission?.granted==false){
        return (
            <>
            
                <View>
                    <Text>
                        Camera permission is required.
                    </Text>
                </View>

                <Pressable style={{marginTop:50}} onPress={cameraPermission}>
                    <Text>
                        Permition for camera
                    </Text>
                </Pressable>
                
                
                
            
            
            
            
            </>
        )
        
    }
    if(microphon?.granted==false){
        return (
            <>
            
                <View>
                    <Text>
                        Camera permission is required.
                    </Text>
                </View>

                <Pressable style={{marginTop:50}} onPress={setMicrophon}>
                    <Text>
                        Permition for camera
                    </Text>
                </Pressable>
                
                
                
            
            
            
            
            </>
        )
        
    }


    function flashFun () {
        if(flash=="on"){
            setFlash("off") ; 
        }
        else if (flash=="off"){
            setFlash("auto") ; 
        }
        else {
            setFlash("on") ; 
        }
    }

    async function takePhoto () {
        const photo = await cameraRef.current.tackPictureAsync({
            quality: 1, // Pass the chosen compression value here
            shutterSound : false
        }) ; 
        console.log(photo) 
        setImg(photo) 
        await MediaLibrary.createAssetAsync(photo.uri)

    }


    async function startVideo () {
        const v = await cameraRef.current.recordAsync() ; 
        console.log(v) 
        setVideo(v) 
        await MediaLibrary.createAssetAsync(v?.uri) ; 
    }
    async function stopVideo () {
        await cameraRef.current.stopRecording() ; 
        // console.log(video)
    }


    



    return (
        <>

        <ScrollView style={{ flex: 1 }}>
            <CameraView 
                mode={mode} 
                style={{width:"100%" , height:450 , marginTop:28}} 
                facing={cameraFace} 
                zoom={zoom} 
                flash={flash} 
                ref={cameraRef} 
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"], // Yeh batata hai ki sirf QR code scan karna hai
                }}
                onBarcodeScanned={scannedData ? undefined : handleBarcodeScanned} 
                enableTorch={toarch}
                
            
            
            />


            {/* <Pressable style={{height:40 , width:"100%"}} onPress={()=>setCameraFace(e=>e=="back"?"front":"back")} > 
                    <Text>
                         {cameraFace + " facing"} 
                    </Text>
            </Pressable> */}


            <Button 
                title={cameraFace + " facing"}
                onPress={()=>setCameraFace(e=>e=="back"?"front":"back")}
            />


            <Button 
                title={"Take image"}
                onPress={takePhoto}
            />

            <Button 
                title={"Toarch"} 
                onPress={()=>setToarch((e)=>!e)} 
            />


            <Button 
                title={mode + " Mode"}
                onPress={()=>setMode((e)=>e=="video"?"picture":"video")}
            />

            <Button 
                title={"start video"}
                onPress={startVideo}
            />


            <Button 
                title={"stop video"}
                onPress={stopVideo}
            />



            <Button 
                title={flash + " flash"}
                onPress={flashFun}
            />

            <Slider 
                minimumValue={0}
                maximumValue={1}
                value={zoom}
                onValueChange={setZoom}
                style={{height:50}}
            
            
            />








            {
                img &&

                    <Image  
                        source={{uri:img.uri}}
                        style={{width:"100%" , height:450}}
                    
                    />
            }



            {
                video && 
                <VideoView
                    player={player}
                    style={{width:"100%" , height:450}}
                
                
                />
            }
        
        
        
        
        
        
        
        
        </ScrollView>
        
        </>
    )
}


export default Camera ; 