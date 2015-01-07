d3.selection.prototype.faceDetection = function (settingsOrCallback) {
  'use strict';
  var time;
  var selection = this;

  function extend (obj1, obj2) {
    var key;
    for(key in obj2) {
      obj1[key] = obj2[key];
    }
    return obj1;
  }

  function contains (arr, value) {
    var i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i] === value) {
        return true;
      }
    }
    return false;
  }

  var options = {
      interval:     4,
      minNeighbors: 1,
      grayscale:    true,
      confidence:   null,
      async:        false,
      complete:     function () {}, // (faces)
      error:        function () {}  // (code, message)
  };

  if ( typeof settingsOrCallback === 'function' ) {
    options.complete = settingsOrCallback;
  } else {
    options = extend(options, settingsOrCallback);
  }

  return selection.each(function() {
    var elem     = this,
        offset   = this.getBoundingClientRect(),
        position = this.getBoundingClientRect(), // I may have to implement JQuerys version of this here.
        scaleX   = (offset.width  / (this.naturalWidth  || this.videoWidth )) || 1,
        scaleY   = (offset.height / (this.naturalHeight || this.videoHeight)) || 1;

    var tagName = this.tagName.toLowerCase();
    if ( !contains(['img', 'video', 'canvas', 'image'], this.tagName.toLowerCase()) ) {
        options.error.apply(elem, [ 1, 'Face detection is possible on images, videos and canvas only.' ]);
        options.complete.apply(elem, [ [] ]);
        return;
    }

    function detect() {
      var source, canvas, flag = false;

      time = new Date().getTime();

      function findFaces () {
        if (options.grayscale) {
          canvas = ccv.grayscale(canvas);
        }

        try {
          if (options.async && window.Worker) {
            ccv.detect_objects({
              'canvas':        canvas,
              'cascade':       cascade,
              'interval':      options.interval,
              'min_neighbors': options.minNeighbors,
              'worker':        1,
              'async':         true
            })(done);
          } else {
            done(ccv.detect_objects({
              'canvas':        canvas,
              'cascade':       cascade,
              'interval':      options.interval,
              'min_neighbors': options.minNeighbors
            }));
          }
        } catch (e) {
          options.error.apply(elem, [ 2, e.message ]);
          options.complete.apply(elem, [ false ]);
        }
      }

      function done(faces) {
        var n = faces.length,
            data = [];

        for (var i = 0; i < n; ++i) {
          if (options.confidence !== null && faces[i].confidence <= options.confidence) {
            continue;
          }

          faces[i].positionX = position.left + faces[i].x;
          faces[i].positionY = position.top  + faces[i].y;
          faces[i].offsetX   = offset.left   + faces[i].x;
          faces[i].offsetY   = offset.top    + faces[i].y;
          faces[i].scaleX    = scaleX;
          faces[i].scaleY    = scaleY;

          data.push(faces[i]);
        }

        data.time = new Date().getTime() - time;

        options.complete.apply(elem, [ data ]);
      }

      if (elem.tagName.toLowerCase() === 'img') {
        source = new Image();
        source.src = elem.src;

        canvas = ccv.pre(source);
        findFaces();

      } else if (elem.tagName.toLowerCase() === 'image') {
        source = new Image();
        source.onload = function () {
          scaleX = (offset.width  / source.naturalWidth) || 1;
          scaleY = (offset.height / source.naturalHeight) || 1;
          if (flag) {
            findFaces();
          } else {
            flag = true;
          }
        };
        source.src = elem.getAttributeNS('http://www.w3.org/1999/xlink', 'href');

        canvas = ccv.pre(source);

        if (flag) {
          findFaces();
        } else {
          flag = true;
        }

      } else if (elem.tagName.toLowerCase() === 'video' || elem.tagName.toLowerCase() === 'canvas') {
        var copy, context;

        source = elem;

        copy = document.createElement('canvas');
        copy.setAttribute('width',  source.videoWidth  || source.width);
        copy.setAttribute('height', source.videoHeight || source.height);

        context = copy.getContext('2d');
        context.drawImage(source, 0, 0);

        canvas = ccv.pre(copy);
        findFaces();

      }
    }

    return detect();
  });
};
