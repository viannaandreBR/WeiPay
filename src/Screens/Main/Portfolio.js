import React, { Component } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { StackNavigator, DrawerNavigator, TabNavigator } from 'react-navigation';
import { List, ListItem, Icon, Button } from 'react-native-elements';
import { connect } from 'react-redux';
import Coins from './Coins'

class Portfolio extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: 'Portfolio',
      headerLeft: (
        <Icon
          name="menu"
          onPress={() => navigation.navigate('DrawerOpen')}
          title="SideMenu"
          style={{ paddingLeft: 20 }}
        />
      )
    }
  }

  render() {

    return (
      <View style={{ flex: 1 }} >
        <List>
          {
            this.props.PortfolioCoins.map((l, i) => (
              <ListItem
                roundAvatar
                avatar={{ uri: l.avatar_url }}
                key={i}
                title={l.name}
                onPress={() => this.props.navigation.navigate(l.type)}
              />
            ))
          }
        </List>
        <View style={styles.btnContainer} >
          <Button
            title='Add Token or Coin'
            icon={{ size: 28 }}
            buttonStyle={{
              backgroundColor: 'blue', borderRadius: 10, width: 250, height: 40, alignItems: 'center',
              justifyContent: 'center', marginBottom: 5.5, marginTop: 5.5
            }}
            textStyle={{ textAlign: 'center' }}
            onPress={() => this.props.navigation.navigate('AddToken')}
          />
        </View>
        {/* <Icon name="add" onPress={() => this.props.navigation.navigate('AddToken')} /> */}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
  btnContainer: {
    marginBottom: 5.5, alignItems: 'center', height: 60, paddingTop: 10, paddingBottom: 10, justifyContent: "center"
  },
})

function mapStateToProps({PortfolioCoins}) {
  return { PortfolioCoins }
}


export default connect(mapStateToProps)(Portfolio);
