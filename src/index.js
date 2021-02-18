import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Image, PermissionsAndroid } from 'react-native';
import { Card } from 'react-native-paper';

import Icon from 'react-native-vector-icons/FontAwesome';
import ImagePicker from 'react-native-image-crop-picker';

import storage from '@react-native-firebase/storage';
import database from '@react-native-firebase/database';

import Geolocation from 'react-native-geolocation-service';

const App = () => {

    const [image, setImage] = useState(null);

    const [uploading, setUploading] = useState(false);
    const [transferred, setTransferred] = useState(0);

    const [hasLocationPermission, setHasLocationPermission] = useState(false);
    const [userPosition, setUserPosition] = useState(false);

    // We can get the user's current location "if we've permission"

    useEffect(() => {
        verifyLocationPermission();

        if (hasLocationPermission) {
            Geolocation.getCurrentPosition(
                position => {
                    setUserPosition({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                error => {
                    console.log(error.code, error.message);
                }
            )
        }
    }, [hasLocationPermission]);

    // Checks whether the user has given permission to access your location

    const verifyLocationPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('Permission granted');
                setHasLocationPermission(true);
            } else {
                console.error('Permission denied');
                setHasLocationPermission(false);
            }
        } catch (error) {
            console.warn(error);
        }
    }

    // Give the user the option to select an image from the gallery

    const onPress = () => {
        ImagePicker.openPicker({
            width: 300,
            height: 400,
            cropping: true
        }).then(picture => {
            setImage(picture.path);
        });
    }

    // Give the user the option to take a picture

    const onPressTP = () => {
        ImagePicker.openCamera({
            width: 300,
            height: 400,
            cropping: true,
        }).then(picture => {
            setImage(picture.path);
        });
    }

    // Processes all information (Sends the image to storage and inserts the information into the database)

    const onPressSend = async () => {
        
        const uploadUri = image;

        let filename = uploadUri.substring(uploadUri.lastIndexOf('/') + 1);

        // Adding 'timestamp' to the file name ( This way we can avoid overwriting some image with equal names)

        const extension = filename.split('.').pop();
        const name = filename.split('.').slice(0, -1).join('.');

        filename = name + Date.now() + '.' + extension;

        setUploading(true);
        setTransferred(0);

        // Uploading the image

        const task = storage().ref(`images/${filename}`).putFile(uploadUri);

        task.on('state_changed', taskSnapshot => {
            setTransferred(Math.round(taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100);
        }, (error) => {
            console.log("Error saving the image: ", error);
        });

        try {
            await task;
            setUploading(true);
        } catch (error) {
            console.log(error);
        }

        setImage(null);

        // Retrieving URL, Date/Time, and User Location Information (latitude/longitude)

        const dataTime = new Date();

        const data = ((dataTime.getDate())) + "/" + ((dataTime.getMonth() + 1)) + "/" + dataTime.getFullYear();
        const time = dataTime.getHours() + ':' + dataTime.getMinutes() + ':' + dataTime.getSeconds();

        const ref = storage().ref(`images/${filename}`);
        const url = await ref.getDownloadURL();

        const metadata = {
            url,
            data,
            time,
            userPosition
        };

        // Saving information to the database

        database()
            .ref(`image_${Math.floor(Math.random() * 10 + 1)}`)
            .set(metadata)
            .then(() => console.log('Data set'));

    }

    /**
     *  Visual part of the application
     * 
     *  "Because it was only one page, it did not have the need to separate into components" 
     * 
     * */ 

    return (
        <>
            <View style={styles.container}>
                <Text style={styles.title}>Upload your picture</Text>
                <Text style={styles.subTitle}>File should be png or jpg</Text>

                <TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
                    <Icon name="folder-open" size={52} color="#6BA0FC" />
                    <Text style={styles.buttonContainerTextTitle}>Click here to select your picture</Text>
                    <Text style={styles.buttonContainerTextSubTitle}>Only one image</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonPictureContainer} onPress={onPressTP}>
                    <Icon name="camera" size={23} color="white" />
                    <Text style={styles.buttonPictureContainerTextTitle}>Take a picture</Text>
                </TouchableOpacity>

                <Text style={styles.uploadedFilesText}>Uploaded picture</Text>

                <Card style={styles.item}>
                    <Image style={{ width: '100%', height: '100%', borderRadius: 10 }} source={{ uri: image }} />
                </Card>

                {uploading ? (
                    <View style={styles.uploadStatus}>
                        <Text>{transferred} % Completed!</Text>
                    </View>

                ) : (
                        <View></View>
                    )
                }

                <TouchableOpacity style={styles.buttonSendContainer} onPress={onPressSend}>
                    <Text style={styles.buttonSendContainerTextTitle}>Send</Text>
                </TouchableOpacity>

            </View>
        </>
    );

}

// Styles applied to the visual part (CSS)

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9'
    },
    title: {
        color: '#303030',
        fontWeight: '700',
        fontFamily: 'Roboto',
        fontSize: 24,
        textAlign: 'center',
        marginTop: 80
    },
    subTitle: {
        color: '#938A8A',
        fontWeight: '500',
        fontFamily: 'Roboto',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8
    },
    buttonContainer: {
        backgroundColor: 'white',
        width: 354,
        height: 198,
        borderRadius: 20,
        borderColor: '#938A8A',
        borderWidth: 2,
        alignItems: 'center',
        alignSelf: 'center',
        padding: '15%',
        marginTop: 40
    },
    buttonContainerTextTitle: {
        color: '#938A8A',
        fontWeight: '500',
        fontFamily: 'Roboto',
        fontSize: 12,
        textAlign: 'center'
    },
    buttonContainerTextSubTitle: {
        color: '#FFB800',
        fontWeight: '500',
        fontFamily: 'Roboto',
        fontSize: 12,
        textAlign: 'center'
    },
    buttonTakePicture: {
        color: 'white'
    },
    buttonPictureContainer: {
        backgroundColor: '#6BA0FC',
        width: 154,
        height: 41,
        borderRadius: 10,
        marginTop: 24,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center'
    },
    buttonPictureContainerTextTitle: {
        color: 'white',
        fontWeight: '700',
        fontFamily: 'Roboto',
        fontSize: 14,
        marginLeft: 8
    },
    uploadedFilesText: {
        color: '#938A8A',
        fontWeight: '500',
        fontFamily: 'Roboto',
        fontSize: 14,
        marginTop: 24,
        marginLeft: 24
    },
    buttonSendContainer: {
        backgroundColor: 'white',
        width: 354,
        height: 54,
        borderRadius: 10,
        marginTop: 32,
        marginBottom: 32,
        alignSelf: 'center',
        justifyContent: 'center'
    },
    buttonSendContainerTextTitle: {
        color: '#6BA0FC',
        fontWeight: '700',
        fontFamily: 'Roboto',
        fontSize: 18,
        textAlign: 'center'
    },
    item: {
        flexGrow: 1,
        flexBasis: 0,
        margin: 4,
        width: 274,
        height: 110,
        borderRadius: 10,
        alignSelf: 'center',
        marginTop: 24
    },
    uploadStatus: {
        alignSelf: 'center',
        marginTop: 8
    }
});

export default App;