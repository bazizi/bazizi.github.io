use crate::gameobject::*;
use crate::vec2::Vec2;
use crate::webutils::*;
use wasm_bindgen::JsCast;
use web_sys::HtmlAudioElement;

pub struct SpaceShip {
    image: web_sys::HtmlImageElement,
    canvas: web_sys::HtmlCanvasElement,
    canvas_context: web_sys::CanvasRenderingContext2d,
    position: Vec2,
    velocity: Vec2,
    mass: f64,
    acceleration: Vec2,
    size: Vec2,
    force: Vec2, // the final result of all forces on the object
    update_audio: HtmlAudioElement,
}

impl SpaceShip {
    pub fn new(
        x: f64,
        y: f64,
        image: &web_sys::HtmlImageElement,
        canvas: &web_sys::HtmlCanvasElement,
    ) -> Self {
        let context = canvas
            .get_context("2d")
            .unwrap()
            .unwrap()
            .dyn_into::<web_sys::CanvasRenderingContext2d>()
            .unwrap();

        Self {
            image: image.clone(),
            canvas: canvas.clone(),
            canvas_context: context,
            position: Vec2 { x, y },
            velocity: Vec2::new(),
            mass: 5.,
            acceleration: Vec2::new(),
            size: Vec2 { x: 25., y: 25. },
            force: Vec2::new(),
            update_audio: HtmlAudioElement::new_with_src("assets/spaceEngine_000.ogg").unwrap(),
        }
    }

    pub fn get_position(&self) -> Vec2 {
        self.position
    }

    pub fn size(&self) -> Vec2 {
        self.size
    }
}

impl GameObject for SpaceShip {
    fn render(&self) {
        self.canvas_context
            .draw_image_with_html_image_element_and_dw_and_dh(
                &self.image,
                self.get_position().x,
                self.get_position().y,
                self.size().x,
                self.size().y,
            )
            .unwrap();
    }

    fn update(&mut self) {
        self.acceleration = self.force / self.mass;

        self.position = self.position + self.velocity;
        self.velocity += self.acceleration;

        self.force = self.force / 2.; // drag

        if self.position.clamp(
            Vec2 { x: 0., y: 0. },
            Vec2 {
                x: self.canvas.width() as f64 - self.size().x,
                y: self.canvas.height() as f64 - self.size().y,
            },
        ) {
            self.velocity.clear();
            self.force.clear();
            self.acceleration.clear();
        }

        if self.velocity.magnitude() > 10. {
            let _promise = self.update_audio.play().unwrap();
        } else {
            let _promise = self.update_audio.pause().unwrap();
            self.update_audio.set_current_time(0.);
        }

        log(&format!(
            "spaceship: [position={}, velocity={}, acceleration={}]",
            self.position, self.velocity, self.acceleration
        ));
    }

    fn add_force(&mut self, force: Vec2) {
        self.force += force;
    }
}
