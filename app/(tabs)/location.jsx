import { Alert, View, Share , TextInput, Button, ScrollView, StyleSheet } from "react-native";
import * as Location from "expo-location"
import { useEffect, useRef, useState } from "react";
import MapView , { Marker } from "react-native-maps"
import * as Sharing from 'expo-sharing';





function location () {

    const [location , setLocation] = useState(null) ; 
    const target = useRef(null) ; 
    const [city , setcity] = useState("") ; 

    async function permission(params) {
        const a = await Location.requestForegroundPermissionsAsync() ; 
        if(a.granted){
            console.log("permission : YES") ; 
        }
    }

    async function curr() {
        const a = await Location.getCurrentPositionAsync() ; 
        console.log(a) ; 
        setLocation(a) ; 
    }

    async function pre() {
        const a = await Location.getLastKnownPositionAsync() ; 
        console.log(a) ; 
        setLocation(a) ; 
    }

    async function fast() {
        await pre() ; 
        await curr() ; 
    }

    async function trackingstart() {
        if(target.current) {
            Alert.alert("tracking is on") ; 
        }
        target.current = await Location.watchPositionAsync(
            {} , 
            (e)=>{
                setLocation(e) ; 
            }
        ) ; 
        
    }

    async function stoptrack(params) {
        if(!target.current){
            console.log("tracking chalu nahi he") ; 
        }
        target.current.remove() ; 
        target.current = null ; 

    }



    useEffect(()=>{
        fast() ; 
    },[])



    async function reverce () {
        const a = await Location.reverseGeocodeAsync({
            latitude : 20.343423 , 
            longitude : 75.265625
        }) ; 

        console.log(a) ; 

    } 


    async function area(a1) {
        const a = await Location.geocodeAsync(city) ; 
        console.log(a) ; 
        setLocation({
            coords : {
                latitude : a[0].latitude , 
                longitude : a[0].longitude , 
            }
        }) ; 
    } 


    async function searchFun() {
        console.log(city) ; 
        area(city) ; 
    }

    async function share(params) {
        await Share.share({
            message : `latitude : ${location?.coords.latitude} ans longitude : ${location?.coords.longitude}` , 
            title : "share"
        })
    }










    return (
        <>


        <ScrollView style={styles.continer}>


        <TextInput onChangeText={setcity} value={city} style={styles.input} />

         <Button
            title="Search"
            onPress={searchFun}
         
         />



        <MapView style={styles.map}
            mapType="hybrid"
            region={{
                latitude : location?.coords.latitude||0 , 
                longitude : location?.coords.longitude||0 , 
                latitudeDelta : 0.8 , 
                longitudeDelta : 0.9 
            }}
        
        
        >

            <Marker
                coordinate={{
                    latitude : location?.coords.latitude||0 , 
                    longitude : location?.coords.longitude||0 
                }}
                title="your Location" 

            />

        </MapView>






        <Button
            title="curr" 
            onPress={curr}
        
        />

        <Button
            title="pre" 
            onPress={pre}
        
        />

        <Button
            title="fast" 
            onPress={fast}
        
        />

        <Button
            title="trackingstart" 
            onPress={trackingstart}
        
        />

        <Button
            title="stoptrack" 
            onPress={stoptrack}
        
        />

        <Button
            title="area" 
            onPress={area}
        
        />

        <Button
            title="Share Coordinates" 
            onPress={share}
        
        />


        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        </ScrollView>
        
        
        
        </>






    )
}



export default location ; 



const styles = StyleSheet.create({
    map:{
        width : "100%" , 
        height:500
    } , 
    continer : {
        flex : 1
    } , 
    input:{
        height:60 , 
        marginTop : 10
     }
})











