require(['lib/Backbone/APITransport'], function () {

    describe('Backbone/APITransport', function () {

        /**
         * API response format
         *
         * 20x
         *
         *  {
         *      status: 20x,
         *      result: string | array | object
         *      models: {
         *          ModelName: [models...],
         *          ...
         *      }
         *  }
         *
         *  40x
         *
         *  {
         *      status: 40x,
         *      errors: {
         *          params: {
         *              name: error
         *          },
         *          generic: ['There has been an error', ...]
         *      }
         *  }
         *
         */

        describe('given a model', function(){
            it('should be able to map it to the API', function(){

            });
        });

        describe('given a collection', function(){
            it('should be able to map it to the API ', function(){

            });
        });

        describe('sending requests', function(){

            describe('GET', function(){
            });

            describe('POST', function(){

            });

            describe('PUT', function(){

            });

            describe('DELETE', function(){

            });

        });


        describe('parsing a response from the server', function () {

            describe('parsing the models of the form: { ModelName: [{..}, {..}, ...], ... } ', function () {
                it('should pass models on to the Registry', function () {

                });
            });

            describe('parsing attributes into a model', function(){
                it("should map all the model's fields properly", function(){

                });
            });


            describe('evaluating results sets', function () {

                // The results of a creation
                describe('result: "ModelName"', function () {
                    it('should return all the models from the given ModelName', function () {

                    });
                });

                describe('result: [ ["ModelName", id1, .. idN] ]', function () {
                    it('should return specific models from the result set, given by their ids', function () {

                    });
                });

                describe('result: { literal }', function () {
                    it('should propagate the attributes', function () {

                    });
                });

            });

        });

        it('should be able to destroy models', function () {

        });

        it('should be able to persist models', function () {

        });

        it('should be able to update models', function () {

        });

        it('should be able to convey API errors', function () {

        });

        it('should discard invalid models', function () {

        });


    });

});