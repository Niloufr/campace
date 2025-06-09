import Vue from 'vue';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        themes: {
            light: {
                primary: '#adc178',    // earthy green
                secondary: '#a98467',  // brown
                accent: '#dde5b6',     // light green
                background: '#f0ead2', // cream
                surface: '#fff',
                text: '#6c584c',       // dark brown
                error: '#FF5252',
                info: '#2196F3',
                success: '#4CAF50',
                warning: '#FFC107'
            }
        }
    }
});
