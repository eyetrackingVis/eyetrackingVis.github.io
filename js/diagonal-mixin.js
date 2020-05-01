var dc = {};

dc.link = {
  path: {
    // diagonal line
    direct: function(){
      return [];
    }

    // this is also the default path in radial trees
    , l_shape: function(x0, y0, x1, y1){
      return [{ x: x1, y: y0 }];
    }

    , l_shape_alt: function(x0, y0, x1, y1){
      return [{ x: x0, y: y1 }];
    }

    , dogleg: function(x0, y0, x1, y1){
      return [
      {   x: x0,
          y: (y0 + y1) / 2
      },
      {   x: (x0 + x1) / 2,
          y: (y0 + y1) / 2
      },
      {   x: x1,
          y: (y0 + y1) / 2
      }];
    }

    , dogleg_alt: function(x0, y0, x1, y1){
      return [
      {   x: (x0 + x1) / 2,
          y: y0
      },
      {   x: (x0 + x1) / 2,
          y: (y0 + y1) / 2
      },
      {   x: (x0 + x1) / 2,
          y: y1
      }];
    }
  }
  , cartesian: {}
  , radial: {}
  , radialUncorrected: {}
};

Object.keys(dc.link.path).forEach( function (el) {
  dc.link.cartesian[el] = function() {
    return d3.mklink( function( context, x0, y0, x1, y1 ) {
      var steps = dc.link.path[el](x0, y0, x1, y1);
      context.moveTo(x0, y0);
      steps.forEach( function (e) {
          context.lineTo( e.x, e.y );
      });
      context.lineTo( x1, y1 );
    });
  };
  dc.link.radial[el] = function() {
    return d3.mklink( function( context, x0, y0, x1, y1 ) {
      var steps = x0 === x1 ? [] : dc.link.path[el](x0, y0, x1, y1),
      start = d3.pointRadial(x0,y0),
      prev = { x: x0, y: y0 }
      context.moveTo(start[0], start[1]);
      steps.push({ x: x1, y: y1 });
      steps.forEach( function (e,i) {
          var pt = d3.pointRadial( e.x, e.y );
          if ( e.x === prev.x ) {
            context.lineTo( pt[0], pt[1] );
          }
          else {
            context.arc(0, 0, e.y, prev.x - Math.PI*0.5, e.x - Math.PI*0.5, e.x > prev.x ? 0 : 1);
          }
          prev = { x: e.x, y: e.y };
      });
    });
  };
  dc.link.radialUncorrected[el] = function() {
    return d3.mklink( function( context, x0, y0, x1, y1 ) {
      var steps = x0 === x1 ? [] : dc.link.path[el](x0, y0, x1, y1),
      start = d3.pointRadial(x0,y0),
      prev = { x: x0, y: y0 }
      context.moveTo(start[0], start[1]);
      steps.push({ x: x1, y: y1 });
      steps.forEach( function (e,i) {
          var pt = d3.pointRadial( e.x, e.y );
          if ( e.x === prev.x ) {
            context.lineTo( pt[0], pt[1] );
          }
          else {
            context.arc(0, 0, e.y, prev.x, e.x, e.x > prev.x ? 0 : 1);
          }
          prev = { x: e.x, y: e.y };
      });
    });
  };
});


dc.diagonalMixin = function (_chart) {

    var _diagonal;

    _chart.diagonal = function (_) {
        if (arguments.length === 0) {
            return _diagonal;
        }
        var ptype = 'cartesian';

        if ( _ !== 'curved' ) {
          if( _chart.radialLayout() ) {
            ptype = 'radial';
          }
          if( _chart.uncorrected ) {
            ptype = 'radialUncorrected';
          }
          try {
            if ( _chart.horizontalOrientation() ) {
                _chart._d3.diagonal = dc.link[ptype][_]()
                  .x(function(d) { return d.y; })
                  .y(function(d) { return d.x; });
            }
            else {
              _chart._d3.diagonal = dc.link[ptype][_]()
                  .x(function(d) { return d.x; })
                  .y(function(d) { return d.y; });
            }
            return _chart;
          }
          catch (err) {
            console.error(err);
          }
        }

        if ( _chart.radialLayout() ) {
          _chart._d3.diagonal = d3.linkRadial()
            .angle(function(d) { return d.x; })
            .radius(function(d) { return d.y; });
        }
        else if ( _chart.horizontalOrientation() ) {
            _chart._d3.diagonal = d3.linkHorizontal()
              .x(function(d) { return d.y; })
              .y(function(d) { return d.x; })
        }
        else {
          _chart._d3.diagonal = d3.linkVertical()
              .x(function(d) { return d.x; })
              .y(function(d) { return d.y; });
        }
        return _chart;

    };

    return _chart;
};

dc.orientationMixin = function (_chart) {

    var _horizontalOrientation = false;

    /**
     * Get or set whether or not the chart displays horizontally. Default is to
     * display vertically (false).
     * @method horizontalOrientation
     * @memberof dc.partitionRectangle
     * @instance
     * @param {Boolean} [bool]
     * @returns {Boolean|dc.partitionRectangle}
     */
    _chart.horizontalOrientation = function (bool) {
      if (!arguments.length) {
        return _horizontalOrientation;
      }
      _horizontalOrientation = bool;
      return _chart;
    };

    return _chart;
};


dc.radialLayoutMixin = function (_chart) {

    var _radialLayout = false;
    /**
     *
     *
     * @method radialLayout
     * @memberof dc.radialLayoutMixin
     * @instance
     * @param {Number} [minHeightForLabel=false]
     * @returns {Number|dc.radialLayoutMixin}
     */
    _chart.radialLayout = function (bool) {
        if (!arguments.length) {
            return _radialLayout;
        }
        _radialLayout = bool;
        return _chart;
    };

    return _chart;
};

