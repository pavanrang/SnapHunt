import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const GROQ_API_KEY = Constants.expoConfig?.extra?.GROQ_API_KEY;

export default function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState('');

  useEffect(() => {
    console.log('GROQ_API_KEY:', GROQ_API_KEY);
  }, []);

  const pickImage = async () => {
    try {
      Alert.alert(
        "Choose Image Source",
        "Would you like to take a picture or choose from the camera roll?",
        [
          {
            text: "Take Picture",
            onPress: () => launchCamera()
          },
          {
            text: "Choose from Camera Roll",
            onPress: () => launchImageLibrary()
          }
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const launchCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    handleImagePickerResult(result);
  };

  const launchImageLibrary = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    handleImagePickerResult(result);
  };

  const handleImagePickerResult = (result) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!GROQ_API_KEY) {
      Alert.alert('Error', `GROQ API key is not set. Current value: ${GROQ_API_KEY}`);
      return;
    }

    try {
      const base64Image = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.2-11b-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "What is there in the image?"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Response status:', response.status);
        console.error('Response body:', errorBody);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        setResult(data.choices[0].message.content);
      } else {
        throw new Error('Unexpected response structure');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', `An error occurred while analyzing the image: ${error.message}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button title="Pick an image" onPress={pickImage} />
      {image && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: image }} style={styles.imagePreview} />
        </View>
      )}
      <Button title="Analyze Image" onPress={analyzeImage} disabled={!image} />
      <Text style={styles.resultText}>{result}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imagePreviewContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  imagePreview: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
  },
  resultText: {
    marginTop: 20,
    textAlign: 'center',
  },
});
