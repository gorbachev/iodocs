(function() {
    // Keyup listener for all of the content parameter input fields 
    // (content parameter input fields should belong only to PUT or POST methods)
    $('.content').find('td.parameter').on( "keyup", "input", function (event) {
        doEverything( $(this) );
    });


    // Select element handling
    // This handles the case of clickng on select drop downs, and tabbing 
    // through the select drop downs and using arrow keys and enter to select 
    // an option.
    $('.content').find('td.parameter').on( "keyup click", "select", function (event) {
        doEverything( $(this) );
    });

    function doEverything ( element ) {
        var classTest = element.parent().parent().attr('class');

        // Collection parameter case
        if ( classTest.match(/collection-original/) || classTest.match(/collection-new/) ) {
            // /collection-original/ is a strange case, when logged, it shows
            // two responses instead of one. No idea why.
            
            // Collect information of all collection elements
            var collectionsArray = [];
            element.closest('tbody').children().each( function (event) {
                var val = $(this).children('td.parameter').children().val();
                var name = $(this).children('td.name').text();
                var attr = $(this).attr('class');
                collectionsArray.push({ 'name': name, 'value': val, 'class': attr });
            });

            var collectionName  = element.closest('table.parameters')
                    .parent()
                    .siblings('td.name')
                    .text()
                    .replace(/Add collection/g, '');

            var tempObj = {};
            tempObj['name'] = collectionName;
            tempObj['value'] = createCollectionValue( collectionsArray );
            updateTextArea( element, tempObj );
        }
        // Content parameter case
        else {
            updateTextArea( element, formatData( element ) );
        }
    }
    // This function determines whether the input was a content parameter or
    // a collection parameter and then does what is necessary to handle the
    // input. 
    //
    // For collection parameter input, it will obtain data from all of the 
    // sibling elements of the particular collection, and create the value for
    // the parent parameter. The parent parameter name will also be obtained.
    // All of this will then be passed to updateTextArea.
    //
    // For regular content parameter input, the input value and input parameter
    // name are obtained and passed on to updateTextArea.

    function createCollectionValue ( collectionsArray ) {
        var temp = '',
            tempObj = {},
            collectionValue = [];
        for ( var i = 0; i < collectionsArray.length; i++ ) {
            if ( collectionsArray[i]['class'] == temp ) {
                var name = collectionsArray[i]['name'];
                var value = collectionsArray[i]['value'];
                if ( value !== '' ) {
                    $.extend(tempObj, createSimpleObject(name, value));
                }
                if ( i == collectionsArray.length - 1 ) {
                    // Check tempObj against schema before adding
                    collectionValue.push(tempObj);
                }
            }
            else {
                temp = collectionsArray[i]['class'];
                if (Object.keys( tempObj ).length !== 0) {
                    // Check tempObj against schema before adding
                    collectionValue.push(tempObj);
                    tempObj = {};
                }
                var name = collectionsArray[i]['name'];
                var value = collectionsArray[i]['value'];
                if ( value !== '' ) {
                    tempObj = createSimpleObject(name, value);
                }
            }
        }

        return collectionValue;
    }
    // Take collected information (collectionsArray), and create an array of objects
    // that will be displayed as the value for the collection-owner parameter.
    //
    // [                                                    [
    //    {                                                    {
    //       name: 'id',                                          'id':324,
    //       value: '324',                                        'enabled':false
    //       class: 'collection-new-2'                         },
    //    },                                                   {
    //    {                               -> becomes ->           'id':8934,
    //       name: 'enabled',                                     'enabled':true
    //       value: 'false',                                   }
    //       class: 'collection-new-2'                      ]
    //    },                                         
    //    {
    //       name: 'id',
    //       value: '8934',
    //       class: 'collection-new-3'
    //    },
    //    {
    //       name: 'enabled',
    //       value: 'true',
    //       class: 'collection-new-3'
    //    }
    //  ]

    function createSimpleObject ( name, value ) {
        var tempObj = JSON.parse( "{\""+name+"\":\""+value+"\"}" );
        tempObj[name]= handleSelectValue(tempObj[name])
        return tempObj;
    }
    // JavaScript object property names must be string values, could not find 
    // a way to interpolate the 'name' variable into a string, so creating a 
    // JSON string, and then parsing that into an object.
    //
    // This function also calls handleSelectValue so that true, false, and 
    // integer values will not show up as strings. handleSelectValue() was 
    // originally intended just for 'select' elements, but this has the side 
    // effect of modifying 'input' elements as well. That doesn't seem a bad 
    // thing, will reconsider with input.

    function formatData ( element ) {
        // Obtain the parameter name and parameter value
        var obj = {};
        obj['name'] = element.parent().siblings('.name').text();
        obj['value'] = handleSelectValue(element.val());
        return obj;
    }

    function handleSelectValue ( value ) {
        if ( value == 'value' || value == 'true' ) { 
            return true;
        }
        else if ( value == 'false' ) {
            return false;
        }
        // Should probably add a seperate check to see if its a number type to
        // begin with
        else if ( /^\d+$/.test(value) ) {
            return parseInt(value);
        }
        else {
            return value;
        }
    }

    function updateTextArea ( element, dataObject ) {
        // Determine the text area to which this parameter belongs
        var goal = element.closest('li.method')
                        .children('form')
                        .children('div.content')
                        .children('div.fields')
                        .children('textarea');

        // Check whether the text area has data stored there already.
        // If it does, create an javascript object with that data;
        // if not, initialize the object.
        var textAreaObj;
        if (goal.val() == '') {
            textAreaObj = {};
        }
        else {
            textAreaObj = JSON.parse(goal.val());
        }

        // Add the new parameter data to the object
        if ( dataObject['value'] === '' ) {
            delete textAreaObj[dataObject['name']];
        }
        else {
            textAreaObj[dataObject['name']] = dataObject['value'];
        }

        // Update the text field
        goal.val(JSON.stringify(textAreaObj, null, 2));
    }


    // Adding new collections to the page
    // First thing, add 'add' button to parameters of type 'collection'
    $("td.type:contains('collection')").each(function() {
        $(this).siblings('td.name')
            .append("<br/><a href='#' class='add-collection' onclick='return false'>Add collection</a>");
    });
    

    // Add new set of collections to the page.
    $('.add-collection').click(function() {
        collectionCount++;
        var originalCollection = $(this).parent()
                                    .siblings('td.parameter')
                                    .find('tr.collection-original');
        
        // Obtain identifier class of the current last element in the list of
        // collections
        var lastClass = $(this).parent().siblings('td.parameter')
            .children('table.parameters')
            .children('tbody')
            .children()
            .last().attr('class');

        // Determine the numeric identifier from the class, then increment and 
        // pass on value
        var collectionCount = 0;
        if ( /collection-original/.test(lastClass) ) {
            collectionCount = 1;
        }
        else {
            collectionCount = parseInt(lastClass.replace(/collection-new-/g, ''));
            collectionCount++;
        }

        // Add the new collection
        $(this).parent().siblings('td.parameter')
            .children('table.parameters')
            .children('tbody')
            .append(newCollection(originalCollection, collectionCount));
    });

    function newCollection (originalCollection, collectionCount) {
        var string;
        var prefix = "<tr class='collection-new-",
            prefixEnd = "' >",
            suffix = "</tr>";

        for (var i = 0; i < originalCollection.length; i++) {
            string += prefix + collectionCount  + prefixEnd
                + originalCollection.get(i).innerHTML
                + suffix;
        }

        return string;
    }

})();
