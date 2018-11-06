import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TouchableWithoutFeedback,
  Dimensions,
  Keyboard,
} from 'react-native';
import { connect } from 'react-redux';
import { FormInput } from 'react-native-elements';
import { NavigationActions } from 'react-navigation';
import RF from 'react-native-responsive-fontsize';
import * as action from '../../../../actions/ActionCreator';
import LinearButton from '../../../../components/linearGradient/LinearButton';
import ClearButton from '../../../../components/linearGradient/ClearButton';
import BoxShadowCard from '../../../../components/shadowCards/BoxShadowCard';
import getNetworkProvider from '../../../../constants/Providers';
import MaliciousAddresses from '../../../../constants/data/json/addresses_darklist.json';
import executeEtherTransaction from '../../../../scripts/tokens/transactions/transactionsEther';
import executeERC20Transaction from '../../../../scripts/tokens/transactions/transactionsERC20';

const ethers = require('ethers');
const img = require('../../../../assets/icons/barcode.png');

const utils = ethers.utils;

class CoinSend extends Component {
  constructor(props) {
    super(props);
    const addressFromQRCode = this.props.addressData;
    this.state = {
      toAddress: addressFromQRCode,
      value: null,
      resetInput: false,
      inputValue: addressFromQRCode,
      txnFee: this.props.txnFee,
      maliciousCheck: true,
      maliciousComment: '',
      sendButtonEnabled: false,
      validAddress: new RegExp('0x[0-9a-fA-F]{40}'),
      valid: false,
    };
  }

  navigate = () => {
    this.props.qrScannerInvoker('TokenFunctionality');
    this.props.qrScannerCoinInvoker(this.props.token.symbol);
    const navigateToQRScanner = NavigationActions.navigate({
      routeName: 'QCodeScanner',
      params: { name: 'Shubhnik', invoker: 'CoinSend' },
    });
    this.props.navigation.dispatch(navigateToQRScanner);
  };

  /**
   * Sets the address to which the coin/tokens are being sent to
   * @param {String} addressInput
   */
  renderAddress(addressInput) {
    const add = addressInput.trim();
    this.setState({ inputValue: add, toAddress: add });
    this.props.getQRCodeData(addressInput);
    if (this.state.validAddress.exec(addressInput) == null) {
      this.setState({ valid: false });
    } else {
      this.setState({ valid: true });
    }
  }

  /**
   * Error checks the value inputted to be sent. Sets the Value to 0 if the value input is
   * either lower than 0 or is not a number
   */
  renderValue(valueInput) {
    if (!isNaN(valueInput)) {
      if (valueInput < 0) {
        Alert.alert(
          'Invalid Ether Amount',
          'Please enter an amount greater than 0.',
          [
            { text: 'OK', onPress: () => { return console.log('OK Pressed');} },
          ],
          { cancelable: false },
        );
      } else {
        console.log(`is a number ${valueInput}`);
        this.setState({ value: valueInput });
      }
    } else {
      console.log(`not a number ${valueInput}`);
      this.setState({ value: null });
    }
  }

  getTxnFee = async () => {
    console.log('in get tx');
    const provider = await getNetworkProvider(this.props.network);
    try {
      let gasPriceString = await provider.getGasPrice().then((gasPrice) => {
        gasPriceString = gasPrice.toString();
        console.log({ gasPriceString });
        const gasPriceEth = utils.formatEther(gasPrice);
        const txnFee = 21000 * gasPriceEth;
        const formatted = txnFee.toFixed(8);
        console.log({ formatted });
        return txnFee;
      });
      await this.props.updateTxnFee(gasPriceString);
      await this.setState({ txnFee: gasPriceString });
    } catch (error) {
      console.log(error);
    }
  }

  resetFields = () => {
    this.inputAddress.clearText();
    this.inputAmount.clearText();
  }

  checkMaliciousAddresses = (address) => {
    for (let i = 0; i < MaliciousAddresses.length; i++) {
      if (address === MaliciousAddresses[i].address) {
        this.setState({ maliciousComment:  MaliciousAddresses[i].comment });
        return { flag: true, 'address' : MaliciousAddresses[i].address, 'comment' : MaliciousAddresses[i].comment };
      }
    }
    return { flag: false };
  }

  processTX = async () => {
    this.getTxnFee();
    const validAddress = this.state.valid;
    const maliciousResponse = await this.checkMaliciousAddresses(this.state.toAddress);
    const { flag } = maliciousResponse;
    const isEtherTX = this.props.token.address === '';
    if (validAddress && !flag) {
      const provider = await getNetworkProvider(this.props.network);
      if (isEtherTX) {
        executeEtherTransaction(
          provider,
          this.state.toAddress,
          this.props.wallet.privateKey,
          this.state.value,
        );
      } else {
        executeERC20Transaction(
          provider,
          this.state.toAddress,
          this.props.wallet.privateKey,
          this.state.value,
          this.props.token.address,
        );
      }
    } else {
      console.log('bad');
    }
  }

  render() {
    const {
      valid, value, maliciousComment, inputValue,
    } = this.state;
    return (
      <SafeAreaView style={styles.safeAreaView}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={ styles.mainContainer }>
            <View style={styles.boxShadowContainer}>
              <View style={styles.contentContainer}>
                <BoxShadowCard>
                  <Text style={styles.cardText}>
                    Send Ether by scanning someone's QR code or public address.
                  </Text>
                  <View style= {styles.barcodeImageContainer}>
                    <TouchableOpacity
                      onPress= {() => { return this.navigate(); }} >
                      <Image
                        source={img}
                        style={styles.barcodeImage}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputContainer}>
                    {
                      maliciousComment !== ''
                        ? <Text style={styles.maliciousCommentText}>Malicious - {maliciousComment} </Text>
                        : null
                    }
                    <View style={styles.formInputContainer}>
                      <FormInput
                        placeholder={'Public Address'}
                        onChangeText={this.renderAddress.bind(this)}
                        ref={(ref) => { return this.inputAddress = ref; }}
                        inputStyle={[styles.formAddress, valid ? styles.colorValid : styles.colorError] }
                        value={inputValue}
                      />
                    </View>
                    <View style={styles.formInputContainer}>
                      <FormInput
                        placeholder={'Amount'}
                        onChangeText={this.renderValue.bind(this)}
                        ref={(ref) => { return this.inputAmount = ref; }}
                        inputStyle={styles.formAmount}
                      />
                    </View>
                    {
                      !valid || !value
                        ? null
                        : <Text style={styles.displayFeeText}> {this.state.txnFee} </Text>
                    }
                  </View>
                </BoxShadowCard>
              </View>
            </View>
            <View style={styles.btnContainer}>
              <View style={styles.btnRow}>
                <View style={styles.btnFlex}>
                  <ClearButton
                    onClickFunction={this.resetFields}
                    buttonText="Reset"
                    customStyles={styles.btnReset}
                  />
                </View>
                <View style={styles.btnFlex}>
                  <LinearButton
                    onClickFunction={this.processTX}
                    buttonText="Send"
                    customStyles={styles.btnSend}
                    buttonStateEnabled={!valid || !value}
                  />
                </View>
              </View>
              <View style={styles.footerGrandparentContainer}>
                <View style={styles.footerParentContainer} >
                  <Text style={styles.textFooter} >Powered by ChainSafe </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
       </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: '#fafbfe',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fafbfe',
    justifyContent: 'center',
    width: '100%',
  },
  boxShadowContainer: {
    alignItems: 'center',
    marginTop: '10%',
    flex: 3.75,
    width: '100%',
  },
  contentContainer: {
    width: '82%',
    flex: 1,
  },
  cardText: {
    paddingBottom: '5%',
    paddingTop: '10%',
    paddingLeft: '10%',
    paddingRight: '10%',
    fontFamily: 'WorkSans-Light',
    fontSize: RF(2.4),
    color: '#000000',
    letterSpacing: 0.4,
  },
  barcodeImageContainer: {
    paddingTop: '5%',
    paddingBottom: '5%',
    paddingLeft: '10%',
  },
  barcodeImage: {
    height: Dimensions.get('window').height * 0.1,
    width: Dimensions.get('window').width * 0.18,
  },
  inputContainer: {
    // add
  },
  maliciousCommentText: {
    color: 'red',
    fontSize: RF(2.1),
    marginLeft: '5%',
  },
  formInputContainer: {
    marginLeft: '4.5%',
  },
  formAddress: {
    width: '90%',
    fontSize: RF(2.2),
    color: '#12c1a2',
    flexWrap: 'wrap',
    fontFamily: 'WorkSans-Light',
    letterSpacing: 0.4,
    paddingBottom: '3%',
  },
  colorValid: {
    color: 'green',
  },
  colorError: {
    color: 'red',
  },
  formAmount: {
    width: '90%',
    fontSize: RF(2.2),
    color: 'black',
    flexWrap: 'wrap',
    fontFamily: 'WorkSans-Light',
    letterSpacing: 0.4,
  },
  displayFeeText: {
    width: '90%',
    marginLeft: '10.5%',
    fontSize: RF(1.6),
    letterSpacing: 0.3,
    fontFamily: 'WorkSans-Light',
    marginTop: '5%',
  },
  btnContainer: {
    flex: 1.25,
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    width: '82%',
    alignContent: 'center',
    marginLeft: '9%',
    marginRight: '9%',
  },
  btnRow: {
    flexDirection: 'row',
  },
  btnFlex: {
    flex: 1,
  },
  btnReset: {
    marginLeft: '0%',
    marginRight: '1.75%',
    height: Dimensions.get('window').height * 0.082,
  },
  btnSend: {
    marginLeft: '1.75%',
    height: Dimensions.get('window').height * 0.082,
  },
  footerGrandparentContainer: {
    alignItems: 'center',
    marginBottom: '5%',
    marginTop: '5%',
  },
  footerParentContainer: {
    alignItems: 'center',
  },
  textFooter: {
    fontFamily: 'WorkSans-Regular',
    fontSize: RF(1.7),
    color: '#c0c0c0',
    letterSpacing: 0.5,
  },

});

const mapStateToProps = ({ Wallet, HotWallet, newWallet, contacts }) => {
  return {
    tokenData: Wallet.activeTokenData,
    wallet: HotWallet.hotWallet.wallet,
    addressData: newWallet.QrData,
    token: Wallet.activeTokenData,
    txnFee: newWallet.txnFee,
    contactAddress: contacts.contactDataforCoinSend,
    network: Wallet.network,
  };
};

export default connect(mapStateToProps, action)(CoinSend);
