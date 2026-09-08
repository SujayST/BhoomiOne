import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors, borderRadius } from '../../theme/colors';
import { userService } from '../../services/userService';

export const AddEditAddressScreen = ({ route, navigation }: any) => {
  const { onSuccess } = route.params || {};

  const [receiverName, setReceiverName] = useState('');
  const [receiverContactNumber, setReceiverContactNumber] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverCity, setReceiverCity] = useState('');
  const [receiverDistrict, setReceiverDistrict] = useState('');
  const [receiverState, setReceiverState] = useState('');
  const [receiverPincode, setReceiverPincode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (
      !receiverName.trim() ||
      !receiverContactNumber.trim() ||
      !receiverAddress.trim() ||
      !receiverCity.trim() ||
      !receiverDistrict.trim() ||
      !receiverState.trim() ||
      !receiverPincode.trim()
    ) {
      setError('Please fill in all mandatory address fields');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const res = await userService.saveAddress({
        receiverName: receiverName.trim(),
        receiverContactNumber: receiverContactNumber.trim(),
        receiverAddress: receiverAddress.trim(),
        receiverCity: receiverCity.trim(),
        receiverDistrict: receiverDistrict.trim(),
        receiverState: receiverState.trim(),
        receiverPincode: receiverPincode.trim(),
      });

      if (res.success || !res.error) {
        if (onSuccess) onSuccess();
        navigation.goBack();
      } else {
        setError(res.error || 'Failed to save address');
      }
    } catch (e: any) {
      setError(e.message || 'Error saving address');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Header
        title="Add Delivery Address"
        showBack
        onBack={() => navigation.goBack()}
        showCart={false}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Input
          label="Receiver / Farmer Name *"
          placeholder="Ramesh Patel"
          value={receiverName}
          onChangeText={setReceiverName}
        />

        <Input
          label="Contact Mobile Number *"
          placeholder="9876543210"
          value={receiverContactNumber}
          onChangeText={setReceiverContactNumber}
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Input
          label="House No. / Farm / Village / Road *"
          placeholder="Farm No. 42, Green Agro Park"
          value={receiverAddress}
          onChangeText={setReceiverAddress}
          multiline
        />

        <View style={styles.row}>
          <Input
            label="City / Town *"
            placeholder="Nagpur"
            value={receiverCity}
            onChangeText={setReceiverCity}
            containerStyle={{ flex: 1, marginRight: 8 }}
          />
          <Input
            label="District *"
            placeholder="Nagpur"
            value={receiverDistrict}
            onChangeText={setReceiverDistrict}
            containerStyle={{ flex: 1, marginLeft: 8 }}
          />
        </View>

        <View style={styles.row}>
          <Input
            label="State *"
            placeholder="Maharashtra"
            value={receiverState}
            onChangeText={setReceiverState}
            containerStyle={{ flex: 1, marginRight: 8 }}
          />
          <Input
            label="Pincode *"
            placeholder="440001"
            value={receiverPincode}
            onChangeText={setReceiverPincode}
            keyboardType="number-pad"
            maxLength={6}
            containerStyle={{ flex: 1, marginLeft: 8 }}
          />
        </View>

        <Button
          title="Save Delivery Address"
          onPress={handleSave}
          loading={submitting}
          size="lg"
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBox: {
    backgroundColor: colors.errorLight,
    padding: 10,
    borderRadius: borderRadius.sm,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  saveBtn: {
    marginTop: 12,
  },
});

