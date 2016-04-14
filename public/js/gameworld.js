(function (exports) {
    // all physics in here
    // no client code
    var GameWorld = function () {
      this.test = true;
      this.test2 = false;
    }

    GameWorld.prototype.attack = function () {}

    GameWorld.prototype.jump = function () {}

    GameWorld.prototype.dodge = function () {}

    GameWorld.prototype.move = function (data) {
        console.log(data + " is moving.");
    }

    exports.GameWorld = GameWorld;
})(typeof global === "undefined" ? window : exports);