YUI().add("slideshow", function(Y) {
    function Slideshow(config) {
        Slideshow.superclass.constructor.apply(this, arguments);
    }
    
    Slideshow.NAME = 'slideshow';
    Slideshow.ATTRS = {
        pause_time: {
            value: 5,
            setter: function(val) {
                return this._set_pause_time(val);
            }
        },
        auto_advance: { value: true },
        slides: { value: [] },
        current_slide: { 
            value: 0,
            validator: function(val) {
                return this._validate_current_slide(val);
            }
        },
        slide_count: { value: 0 },
        activate_next_prev_buttons: { value: true },
        next_button: { value: null },
        prev_button: { value: null },
        activate_slide_buttons: { value: true },
        slide_buttons: {value: [] }
    };
    // The CSS selectors
    Slideshow.AUTO_SLIDESHOW_SELECTOR = '.slideshow';
    Slideshow.CURRENT_CLASS = 'current';
    Slideshow.NEXT_BUTTON_SELECTOR = '.next';
    Slideshow.PREV_BUTTON_SELECTOR = '.previous';
    Slideshow.BUTTON_SELECTOR = '.slideSelector';
    Slideshow.HTML_PARSER = {
        slides: function (contentBox) {
            var slide_nodes = contentBox.all('.slide');
            if (slide_nodes.size() === 0) {
                slide_nodes = contentBox.get('children');
            }
            return slide_nodes;
        },
        next_button: function(contentBox) {
            return contentBox.one(Slideshow.NEXT_BUTTON_SELECTOR);
        },
        prev_button: function(contentBox) {
            return contentBox.one(Slideshow.PREV_BUTTON_SELECTOR);
        },
        slide_buttons: function(contentBox) {
            return contentBox.all(Slideshow.BUTTON_SELECTOR);
        }
    };

    Y.extend(Slideshow, Y.Widget, {
        initializer: function() {
            // Get how many slides there are
            var slides = this.get('slides');
            var slide_count = slides.size();
            this.set('slide_count', slide_count);
            // Setting the current slide
            var current_slide = Y.Array.indexOf(slides.hasClass(Slideshow.CURRENT_CLASS), true);
            if (current_slide > -1) {
                this.set('current_slide', current_slide);
            }
            slides.item(this.get('current_slide')).addClass(Slideshow.CURRENT_CLASS);
            
            if (this.get('activate_next_prev_buttons')) {
                this._init_next_prev_buttons();
            }
            
            if (this.get('activate_slide_buttons')) {
                this._init_buttons();
            }
            
        },
        
        syncUI: function() {
            this._update_slide_display();
            if (this.get('auto_advance')) {
                this._pause();
            }
        },
        
        run: function() {
            this.set('auto_advance', true);
            this.advance();
        },
        
        stop: function() {
            this.timer.cancel();
            this.set('auto_advance', false);
        },
        
        show_slide: function(slide_number) {
            this.timer.cancel();
            if (slide_number != this.get('current_slide')) {
                this.set('current_slide', slide_number);        
                this.syncUI();
            }

        },
        
        _display_slide: function(slide_number) {
            this._before_display();
            this.get('slides').item(slide_number).addClass(Slideshow.CURRENT_CLASS);
            this._after_display();
        },
        _before_display: function() {
            this.fire('slideshow:before-slide-displayed', {
                slide: this.get('slides').item(this.display_slide), 
                slide_number: this.display_slide
            });
        },
        _after_display: function() {
            this.fire('slideshow:slide-displayed', {
                slide: this.get('slides').item(this.display_slide),
                slide_number: this.display_slide
            });
        },


        _hide_slide: function(slide_number) {
            this._before_hide();
            this.get('slides').item(slide_number).removeClass(Slideshow.CURRENT_CLASS);
            this._after_hide();
        },
        _before_hide: function() {
            this.fire('slideshow:before-slide-hidden', {
                slide: this.get('slides').item(this.hide_slide), 
                slide_number: this.hide_slide
            });
        },
        _after_hide: function() {
            this.fire('slideshow:slide-hidden', {
                slide: this.get('slides').item(this.hide_slide),
                slide_number: this.hide_slide
            });
        },
        
        advance: function() {
            this.show_slide(this._get_next_slide());
        },

        previous: function() {
            this.show_slide(this._get_previous_slide());
        },
        
        _pause: function() {
            this.timer = Y.later(this.get('pause_time'), this, 'advance');
        },
        
        _get_next_slide: function() {
            var next_slide = this.get('current_slide') + 1;
            if (next_slide >= this.get('slide_count')) {
                return 0;
            } else {
                return next_slide;
            }
        },

        _get_previous_slide: function() {
            var prev_slide = this.get('current_slide') - 1;
            if (prev_slide < 0) {
                return this.get('slide_count') - 1;
            } else {
                return prev_slide;
            }
        },
        
        _update_slide_display: function() {
            var current = this.get('current_slide'),
                count = this.get('slide_count'),
                slides = this.get('slides');
                
            for ( var i = 0; i < count; i++) {
                if (i == current) {
                    if (!slides.item(i).hasClass(Slideshow.CURRENT_CLASS)) {
                        this.display_slide = i;
                    }
                } else {
                    if (slides.item(i).hasClass(Slideshow.CURRENT_CLASS)) {
                        this.hide_slide = i;
                    }
                }
            }
            if (this.display_slide >= 0) {
                this._display_slide(this.display_slide);
            }
            if (this.hide_slide >= 0) {
                this._hide_slide(this.hide_slide);
            }
        },

        _init_next_prev_buttons: function() {
            var next = this.get('next_button');
            if (next) {
                next.on('click', function(e){
                    e.preventDefault();
                    this.stop();
                    this.advance();
                }, this);
            }
            var prev = this.get('prev_button');
            if (prev) {
                prev.on('click', function(e){
                    e.preventDefault();
                    this.stop();
                    this.previous();
                }, this);
            }
        },

        _init_buttons: function() {
            var buttons = this.get('slide_buttons');
            var button_count = buttons.size();
            if (button_count > 0) {
                this.set('slide_buttons', buttons);
                // Setting up the on click functionality for each button
                for(var i =0; i < button_count; i++) {
                    buttons.item(i).on('click', function(e, slide_number) {
                        e.preventDefault();
                        this.stop();
                        this.show_slide(slide_number);
                    }, this, i);
                }
                // Changing the current button as the slide changes
                this.on('slideshow:before-slide-displayed', function(e) {
                    buttons.item(e.slide_number).addClass(Slideshow.CURRENT_CLASS);
                });
                this.on('slideshow:before-slide-hidden', function(e) {
                    buttons.item(e.slide_number).removeClass(Slideshow.CURRENT_CLASS);
                });
            }
        },

        /*
         * Converts the seconds into milliseconds
         */
        _set_pause_time: function(val) {
            // Converting from seconds to microseconds
            return val * 1000;
        },
        
        _validate_current_slide: function(val) {
            var min = 0,
                max = this.get("slide_count");
            return (Y.Lang.isNumber(val) && val >= min && val <= max);
        }

    });

    Slideshow.auto = function(attrs) {
        if (!attrs) { attrs = {}; }
        selector = attrs.selector || Slideshow.AUTO_SLIDESHOW_SELECTOR;
        pause_time = attrs.pause_time || Slideshow.ATTRS.pause_time.value;

        Y.all(selector).each(function() {
            var slideshow_instance = new Slideshow({
                contentBox: this,
                pause_time: pause_time
            });
            slideshow_instance.render();
        });
    };

    Y.Slideshow = Slideshow;

}, '0.0.1', {requires: ['widget'] } );





YUI().add("animatedSlideshow", function(Y) {
    /***********************************
    * Functionality to add animation to the slideshow
    *
    ***********************************/
    function Animated() { 
        this._init_animated(); 
    }

    Animated.ANIMATION_DURATION = 0.5;
    Animated.ATTRS = { 
        animation_out: { 
            value: {
                from: { opacity: 1},
                to: { opacity: 0 },
                duration: Animated.ANIMATION_DURATION
            }
        },
        animation_in: { 
            value: {
                from: {opacity: 0},
                to: { opacity: 1 },
                duration: Animated.ANIMATION_DURATION
            }
        },
        reverse_animation: { value: false }
    };

    Animated.prototype = { 
        _init_animated: function() {
            // Setup the display/hide animation
            if (this.get('animation_in')) {
                this.anim_in = new Y.Anim(this.get('animation_in'));
                this.anim_in.on('end', this._after_display, this);
                if (this.get('reverse_animation')) {
                    this.orig_anim_in = this.anim_in;
                    // Creating the reverse animation
                    this.reverse_anim_in = new Y.Anim(this.get('animation_out'));
                    this.reverse_anim_in.on('end', this._after_display, this);
                    this.reverse_anim_in.set('reverse', true);
                }
            } else {
                this.anim_in = null;
            }
            if (this.get('animation_in')) {
                this.anim_out = new Y.Anim(this.get('animation_out'));
                this.anim_out.on('end', this._after_hide, this);
                if (this.get('reverse_animation')) {
                    this.orig_anim_out = this.anim_out;
                    // Creating the reverse animation
                    this.reverse_anim_out = new Y.Anim(this.get('animation_in'));
                    this.reverse_anim_out.on('end', this._after_hide, this);
                    this.reverse_anim_out.set('reverse', true);
                }
            } else {
                this.anim_out = null;
            }

            this.anim_in.set('reverse', true);
            this.anim_out.set('reverse', true);


            // Checking if the animation is setting the opacity
            // If it is then set all the non-current slides to the opacity
            var t = this.anim_out.get('to');
            var opacity = (parseInt(t.opacity, 10));
            if (!isNaN(opacity)) {
                this.get('slides').each(function(slide) {
                    if (!slide.hasClass(Y.Slideshow.CURRENT_CLASS)) {
                        slide.setStyle('opacity', opacity);
                    }
                });
            }
        },

        show_slide: function(slide_number) {
            this.timer.cancel();
            if (this._anim_running()) {
                Y.later(this.get('pause_time')/20, this, 'show_slide', slide_number);
            } else {
                this.set('current_slide', slide_number);
                this.syncUI();
            }
        },

        _anim_running: function() {
            if (this.anim_in.get('running') || this.anim_out.get('running')) {  
                return true; 
            } else {
                return false;
            }
        },
        
        _display_slide: function(slide_number) {
            var slide = this.get('slides').item(slide_number);
            this._before_display();
            slide.addClass(Y.Slideshow.CURRENT_CLASS);
            this.anim_in.set('node', slide);
            this.anim_in.run();
        },
        
        _hide_slide: function(slide_number) {
            this._before_hide();
            this.anim_out.set('node', this.get('slides').item(slide_number));
            this.anim_out.run();
        },
        _after_hide: function() {
            this.get('slides').item(this.hide_slide).removeClass(Y.Slideshow.CURRENT_CLASS);
            this.fire('slideshow:slide-hidden', {
                slide: this.get('slides').item(this.hide_slide),
                slide_number: this.hide_slide
            });
        },
        advance: function() {
            if (this.get('reverse_animation')) {
                this.anim_in = this.orig_anim_in;
                this.anim_out = this.orig_anim_out;
            }
            this.anim_in.set('reverse', false);
            this.anim_out.set('reverse', false);
            this.show_slide(this._get_next_slide());
        },

        previous: function() {
            if (this.get('reverse_animation')) {
                this.anim_in = this.reverse_anim_in;
                this.anim_out = this.reverse_anim_out;
            }
            this.show_slide(this._get_previous_slide());
        }
    };



    var AnimatedSlideshow = Y.Base.build("animatedSlideshow", Y.Slideshow, [Animated]);
    AnimatedSlideshow.nodes = [];
    AnimatedSlideshow.auto = function() {
        AnimatedSlideshow.auto_horizontal();
        AnimatedSlideshow.auto_vertical();
        Y.all(Y.Slideshow.AUTO_SLIDESHOW_SELECTOR).each(function() {
            if (Y.Array.indexOf(AnimatedSlideshow.nodes, this) == -1) {
                // The node isn't a slideshow already so make it into one
                var slideshow_instance = new AnimatedSlideshow({contentBox: this });
                slideshow_instance.render();
                AnimatedSlideshow.nodes.push(this);
            }
        });
        AnimatedSlideshow.nodes = null;
    };
    
    AnimatedSlideshow.AUTO_HORIZONTAL_SELECTOR = '.horizontalSlideshow';
    AnimatedSlideshow.auto_horizontal = function(attrs) {
        if (!attrs) { attrs = {}; }
        selector = attrs.selector || AnimatedSlideshow.AUTO_HORIZONTAL_SELECTOR;
        duration = attrs.animation_duration || Animated.ANIMATION_DURATION;
        pause_time = attrs.pause_time || Y.Slideshow.ATTRS.pause_time.value;
        
        Y.all(selector).each(function() {
            if (Y.Array.indexOf(AnimatedSlideshow.nodes, this) == -1) {
                var slide = this.one('.slide'),
                    width = parseInt(slide.getComputedStyle('width'), 10) + 10;

                var slideshow_instance = new AnimatedSlideshow({
                    contentBox: this,
                    pause_time: pause_time,
                    animation_out: {
                        from: { left: 0 },
                        to: {left: (-1 * width)},
                        duration: duration
                    },
                    animation_in: {
                        from: {left: width },
                        to: {left: 0},
                        duration: duration
                    },
                    reverse_animation: { value: true }
                });
                slideshow_instance.render();
                AnimatedSlideshow.nodes.push(this);
            }
        });
    };
    
    AnimatedSlideshow.AUTO_VERTICAL_SELECTOR = '.verticalSlideshow';
    AnimatedSlideshow.auto_vertical = function(attrs) {
        if (!attrs) { attrs = {}; }
        selector = attrs.selector || AnimatedSlideshow.AUTO_VERTICAL_SELECTOR;
        duration = attrs.animation_duration || Animated.ANIMATION_DURATION;
        pause_time = attrs.pause_time || Y.Slideshow.ATTRS.pause_time.value;

        Y.all(selector).each(function() {
            if (Y.Array.indexOf(AnimatedSlideshow.nodes, this) == -1) {
                var slide = this.one('.slide'),
                    height = parseInt(slide.getComputedStyle('height'), 10) + 10;

                var slideshow_instance = new AnimatedSlideshow({
                    contentBox: this,
                    pause_time: pause_time,
                    animation_out: {
                        from: { top: 0 },
                        to: {top: (-1 * height)},
                        duration: duration
                    },
                    animation_in: {
                        from: {top: height },
                        to: {top: 0},
                        duration: duration
                    },
                    reverse_animation: { value: true }
                });
                slideshow_instance.render();
                AnimatedSlideshow.nodes.push(this);
            }
        });
    };
    Y.AnimatedSlideshow = AnimatedSlideshow;
}, '0.0.1', {requires: ['slideshow', 'anim-base'] } );
