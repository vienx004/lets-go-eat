<script src="http://localhost:8098"></script>
<template>
    <Page>
        <ActionBar title="Let's Go Eat!" android:flat="true"/>
        <TabView android:tabBackgroundColor="#53ba82"
                 android:tabTextColor="#c4ffdf"
                 android:selectedTabTextColor="#ffffff"
                 androidSelectedTabHighlightColor="#ffffff">
            <TabViewItem title="What are you in the mood for...">
                <StackLayout>
                    <ListView for="category in categories">
                        <v-template>
                            <label v-bind:class="{ selected : category.searchIndicator }" @tap="setCriteria(category)" height="10%" :text="category.name"></label>
                        </v-template>
                    </ListView>
                    <button text="Get Results For Your Location" @tap="getRestaurants" color="#53ba82" height="50"/>
                </StackLayout>
            </TabViewItem>
            <TabViewItem title="Tab 1">
                <StackLayout>
                    <button text="Get Results For Your Location" @tap="getRestaurants" color="#53ba82" height="50"/>
                    <ListView for="result in results">
                        <v-template>
                            <CardView>
                                <GridLayout class="photo" columns="*, 60, 30" rows="300, 40, 40">  
                                    <Image class="photo" row="0" col="0" colSpan="3" :src="getPhotoReferenceURL(result.photos[0].photo_reference, GOOGLE_API_KEY)" stretch="aspectFill" />
                                    <label row="1" col="0" colSpan="1" :text="result.name"/>
                                    <label row="1" col="1" colSpan="1">Rating: </label>
                                    <label row="1" col="2" colSpan="1" :text="result.rating" horizontalalignment="left"/>
                                    <Button class="navigation-button" @tap="getNavigation(currentLocation, result)" row="2" col="0" colSpan="3">Take Me There</Button>
                                </GridLayout>
                            </CardView>
                        </v-template>
                    </ListView>
                </StackLayout>
            </TabViewItem>
            <TabViewItem title="Tab 2">
                <StackLayout>
                    <button text="Get Saved Places" @tap="load" color="#53ba82" height="50"/>
                        <ListView for="savedPlace in savedPlaces" height="100%">
                            <v-template>    
                                <CardView>
                                    <GridLayout class="photo" columns="*, 60, 30" rows="300, 40, 40">
                                        <Image class="photo" row="0" col="0" colSpan="3" :src="getPhotoReferenceURL(savedPlace.photo_ref, GOOGLE_API_KEY)" stretch="aspectFill" />
                                        <label row="1" col="0" colSpan="1" :text="savedPlace.name"/>
                                        <label row="1" col="1" colSpan="1">Rating: </label>
                                        <label row="1" col="2" colSPan="1" :text="savedPlace.place_id" horizontalalignment="left"/>
                                        <Button class="navigation-button" row="2" col="0" colSpan="3">Take Me There</Button>
                                    </GridLayout>
                                </CardView>
                            </v-template>
                        </ListView>
                </StackLayout>
            </TabViewItem>
        </TabView>
    </Page>
</template>


<script>
import axios from 'axios';
import geolocation from 'nativescript-geolocation';
import utils from 'tns-core-modules/utils/utils';
import * as ApplicationSettings from 'tns-core-modules/application-settings';
import sqlite from 'nativescript-sqlite';


  export default {
    data() {
      return {
        count: 0,
        endOfList: false,
        results: [''],
        GOOGLE_API_KEY: 'AIzaSyDZR5uvkkNS7g_eovjOyH6lrrXdHv59rqc',
        currentLocation: {},
        basePhotoURL: 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=500&photoreference=' ,
        baseNavigationURL: 'https://www.google.com/maps/dir/?api=1&origin=',
        input: {
            name: '',
            placeId: ''
        },
        database: '',
        savedPlaces: [],
        categories: [{'name':'chinese', 'searchIndicator': false}, 
                     {'name':'mexican', 'searchIndicator': false}, 
                     {'name':'sushi', 'searchIndicator': false}, 
                     {'name':'american', 'searchIndicator': false}, 
                     {'name':'indian', 'searchIndicator': false}, 
                     {'name':'fastfood', 'searchIndicator': false}, 
                     {'name':'seafood', 'searchIndicator': false}, 
                     {'name':'vegetarian', 'searchIndicator': false}, 
                     {'name':'vietnamese', 'searchIndicator': false}]
      }
    },

    methods: {
        getRestaurants() {
            this.endOfList = false;

            return axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+this.currentLocation.latitude+','+this.currentLocation.longitude + '&radius=3000&type=restaurant&keyword=' + this.getSearchCriteria() +'&key=' + this.GOOGLE_API_KEY)
                    .then((response) => {
                        let search_results = response.data
                        this.results = search_results.results
                    })
                    .catch((error) => console.log(error))
        },
        getSearchCriteria(){
            var searchString = [];
            var count = Object.keys(this.categories).length;

            for(var i = 0; i < count; i++){
                if(this.categories[i].searchIndicator) {
                    searchString.push(this.categories[i].name);
                }
            }
            console.log(searchString.join('+'));
            return searchString.join('+');
        },
        getNextResult(){
            if(this.results.length > this.count) {
                this.count = this.count + 1;              
            }
            else {
                this.count = 0;
                this.endOfList = true;
            }
        },
        getCurrentLocation() {
            var geolocation = require("nativescript-geolocation");
            return geolocation.getCurrentLocation({desiredAccuracy: 3, updateDistance: 10, maximumAge: 20000, timeout: 20000})
                .then((location) => {this.currentLocation = location})
                .catch((error) => console.log(error))
        },
        getPhotoReferenceURL(photo_reference, GOOGLE_API_KEY) {
            return this.basePhotoURL + photo_reference + '&key=' + GOOGLE_API_KEY;
        },
        getNavigation(origin, destination) {
            var utils = require("tns-core-modules/utils/utils")
            var destinationFormat = destination.name.replace(/ /g, '+');
            console.log(this.baseNavigationURL + origin.latitude + ',' + origin.longitude + '&destination=' + destinationFormat + '&destination_place_id=' + destination.place_id  + '&travelmode=driving')
            this.save(destination.name, destination.place_id, destination.photos[0].photo_reference);
            return utils.openUrl(this.baseNavigationURL + origin.latitude + ',' + origin.longitude + '&destination=' + destinationFormat + '&destination_place_id=' + destination.place_id  + '&travelmode=driving');
        }, 
        load() {
            this.database.all("SELECT * FROM LetsEat").then(rows => {
                this.savedPlaces = [];
                console.log('get all')
                for(var row in rows){
                    this.savedPlaces.push({
                        "name": rows[row][1],
                        "place_id": rows[row][2],
                        "photo_ref": rows[row][3],
                        "date_added": rows[row][4]
                    })
                    console.log(this.savedPlaces[row])
                }
            }, error => {
                console.log("SELECT ERROR", error);
            })
        },
        createTable() {
            new sqlite("letseat.db").then(db => {
                db.execSQL("CREATE TABLE IF NOT EXISTS LetsEat (id INTEGER PRIMARY KEY ASC, place_name TEXT, place_id TEXT, photo_ref TEXT, date_added)").then(id => {
                    console.log("TABLE CREATED");
                    this.database = db;
                }, error => {
                    console.log("TABLE CREATE ERROR");
                })
            })
        },
        save(place_name, place_id, photo_ref) {
                this.database.execSQL("INSERT INTO LetsEat (place_name, place_id, photo_ref, date_added) VALUES (?,?,?,?)", [place_name, place_id, photo_ref, Date.now()], function(err, id) {
                    console.log("The new record id is: " + id);
                });
        },
        //AIzaSyDZR5uvkkNS7g_eovjOyH6lrrXdHv59rqc
        setCriteria(category) {
            if(!category.searchIndicator) {
                category.searchIndicator = true;
            }
            else {
                category.searchIndicator = false;
            }
        }
    },

    created: function (){
        this.getCurrentLocation();
        this.createTable();
        this.savedPlaces = [];
    },

    mounted(){
        
    }
  }
</script>

<style scoped>
    ActionBar {
        background-color: #53ba82;
        color: #ffffff;
    }

    .selected {
        color: #53ba82;
    }

    .message {
        vertical-align: center;
        text-align: center;
        font-size: 20;
        color: #333333;
    }

    .photo {
        align-items: center;
        align-content: center;
        align-self: center;
    }

    .restaurantName {
        align-content: center;
    }

    .navigation-button {
        background-color: #53ba82;
        color: white;
    }

    .container {
        align-items: center;
        align-content: center;
    }

    .left-icon {
        text-align: center;
        border-bottom-width: 3px;
        border-bottom-style: solid;
        border-bottom-color: #53ba82;
    }

    .right-icon {
        text-align: center;
        border-bottom-width: 3px;
        border-bottom-style: solid;
        border-bottom-color: #53ba82;
    }

    .center-icon {
        text-align: center;
        border-bottom-width: 3px;
        border-bottom-style: solid;
        border-bottom-color: #53ba82;
        border-left-width: 3px;
        border-left-style: solid;
        border-left-color: #53ba82;
        border-right-width: 3px;
        border-right-style: solid;
        border-right-color: #53ba82;
    }
</style>