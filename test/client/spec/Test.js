require([
    'Model',
    'Collection',
    'lib/Backbone/ModelRegistry',
    'lib/Backbone/sync',
    'lib/models',
    'lib/cols'], function (
    Model, Collection, Registry
    ) {


    var uniqueMongoId = function () {
        return (uniqueMongoId.counter++).toString().padLeft(' ', 24)
    }
    uniqueMongoId.counter = 0;


    var randomMongoObj = function () {
        return randomObj({_id:uniqueMongoId()})
    }


    var randomName = function () {
        return randomName.letters.sample(Number.random(3, 8)).join('');
    }
    randomName.letters = 'abcdefghijklmnopqrstuvwxyz'.split('');


    var randomObj = function (obj) {
        obj = obj || {}
        return obj;
    }

    describe('Model / Registry', function () {

        var user = randomMongoObj()
            , poll = randomMongoObj();

        var apiResponse = {
            result:'User',
            models:{
                User:[user],
                Poll:[poll]
            }
        }

        var model = new (Model.extend({
            urlRoot:'/model'
        }));

        var collection = new (Collection.extend({
            urlRoot:'/col'
        }));

        $.mockjax({
            url:'/api/col',
            responseText:apiResponse
        })

        describe('#sync', function () {

            beforeEach(function () {
                collection.fetch();
            });

            it('should properly parse fetched results into the registry', function () {
                expect(Registry.fetch('User', user._id).attributes)
                    .toEqual(user)
            });

        });


    });

});