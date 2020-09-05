import React from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { formatRelative } from 'date-fns';

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxPopover,
  ComboboxOption,
} from "@reach/combobox";

import "@reach/combobox/styles.css";

import mapstyles from './mapstyles.js';

const libraries = ["places"];

const mapContainerStyle = {
  width: '99vw',
  height: '98vh',
}

const center = {
  lat: 1.35,
  lng: 103.8198,
}

const options = {
  styles: mapstyles,
  disableDefaultUI: true,
  zoom: 12,
  zoomControl: true
}

function App() {
  const { isLoaded, loadError } = useLoadScript( {
    googleMapsApiKey: "AIzaSyA9-UQ12VCmyFFc4VKnDh_XtJMThYACT1A",
    libraries,
  });

  const [markers, setMarkers] = React.useState( [] );

  const [selected, setSelected] = React.useState( null );

  const onMapClick = React.useCallback( (event)=> {
    setMarkers(current => [
      ...current, 
      {
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng(),
        time: new Date(),
      },
    ])
  }, [] );

  const mapRef = React.useRef();

  const onMapLoad = React.useCallback( map => {
    mapRef.current = map;
  }, []);

  const panTo = React.useCallback(({lat, lng}) => {
    mapRef.current.panTo( { lat, lng } );
    mapRef.current.setZoom(15);
  }, [] );

  if (loadError) return 'Error loading maps';
  if (!isLoaded) return 'Error loading maps';

  return ( 
    <div>
      <h1> React <span role="img" aria-label>🐻⛺</span></h1>
      
      <Search panTo={panTo}/> 

      <Locate panTo={panTo}/>

      <GoogleMap 
      mapContainerStyle={mapContainerStyle}
      center={center}
      options={options}
      onClick={onMapClick}
      onLoad={onMapLoad}
      >
        {
          markers.map(marker => (
          <Marker
            key={marker.time.toISOString()} 
            position = {{lat: marker.latitude, lng: marker.longitude }} 
            icon = {{
              url: '/logo192.png',
              scaledSize: new window.google.maps.Size(30, 30),
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(15, 15),
            }
            }
            onClick={()=> {
              setSelected(marker);
            }}
            /> 
          ))
        }

        { selected ? (
          <InfoWindow 
            position = {{lat: selected.latitude, lng: selected.longitude}} 
            onCloseClick= {()=> setSelected(null)}
            >
            <div>
              <h2>React Event</h2>
              <p>Identified at time: {formatRelative( selected.time, new Date() ) }</p>
            </div>
          </InfoWindow  >
        ): null}
      </GoogleMap>
    </div>
  );
}

function Locate({panTo}) {
  return ( 
    <button 
      className="locate" 
      onClick={() => {
        console.log("Clicked button");
        navigator.geolocation.getCurrentPosition( position => {
            panTo({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          }, 
        () => null, 
        () => null);
      }}
      >
      <img 
      src="/compass.png" 
      alt ="Locate Me" 
      width="25" 
      height="25"/>
    </button>
  )
}

function Search( { panTo } ) {
  const {
    ready, 
    value, 
    suggestions: { status, data },
    setValue,
  clearSuggestions,
} = usePlacesAutocomplete({
    requestOptions: {
      location: {
        lat: () => center.lat,
        lng: () => center.lng,
      },
      radius: 200 * 1000,
    }
  });

  return (
    <div className="search">
      <Combobox
        onSelect = { async(address) => {
          setValue(address, true);
          clearSuggestions();

          try {
            const results = await getGeocode({address});
            const { lat, lng } = await getLatLng(results[0]);
            console.log(results[0]);
            console.log(lat, lng);
            panTo({lat, lng}) ;
          } catch ( error ) {
            console.log("Error!" + error);
          } 
        }}
        >
        <ComboboxInput
        value={value} 
        onChange={e=>
          setValue(e.target.value)
        }
        disabled={!ready}
        placeholder="Enter an address"
        />
        <ComboboxPopover>
          <ComboboxList>
            { status === "OK" && 
                data.map(({id, description}) => (
                  <ComboboxOption key={id} value={description}/>
              ))
            }
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
}

export default App;
