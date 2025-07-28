import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Step0Intro from '../components/welcomeScreen/Step0Intro';
import Step1Personal from '../components/welcomeScreen/Step1Personal';
import Step2Health from '../components/welcomeScreen/Step2Health';
import Step3Emergency from '../components/welcomeScreen/Step3Emergency';
import Step4Permissions from '../components/welcomeScreen/Step4Permissions';
import Step5Config from '../components/welcomeScreen/Step5Config';

export default function WelcomeScreen({ navigation }: any) {
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    const restoreStep = async () => {
      const storedStep = await AsyncStorage.getItem('onboardingStep');
      if (storedStep) {
        setStep(parseInt(storedStep, 10));
      }
    };
    restoreStep();
  }, []);

  const updateStep = async (newStep: number) => {
    await AsyncStorage.setItem('onboardingStep', newStep.toString());
    setStep(newStep);
  };

  const goToHome = () => {
    navigation.replace('Home');
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <Step0Intro onNext={() => updateStep(1)} />;
      case 1:
        return <Step1Personal onNext={() => updateStep(2)} />;
      case 2:
        return <Step2Health onNext={() => updateStep(3)} />;
      case 3:
        return <Step3Emergency onNext={() => updateStep(4)} />;
      case 4:
        return <Step4Permissions onNext={() => updateStep(5)} />;
      case 5:
        return <Step5Config onFinish={goToHome} />;
      default:
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Tanımsız adım: {step}</Text>
          </View>
        );
    }
  };

  return <View style={styles.container}>{renderStep()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
});
