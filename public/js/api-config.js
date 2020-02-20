define(function () {

    // API Transport Configuration
    return {
        basePath:'/api',

        models:{

            Course:{
                url:'/courses',
                schema: {
                    updatedAt: Date
                }
            },

            Horario:{
                url:'/horarios'
            },

            Program:{
                url:'/programs',
                schema: {
                    updatedAt: Date
                }
            }
        }

    }
});