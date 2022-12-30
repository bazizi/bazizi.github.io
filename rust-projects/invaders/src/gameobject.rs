use crate::vec2::Vec2;

pub trait GameObject {
    fn render(&self);
    fn update(&mut self);
    fn add_force(&mut self, force: Vec2);
}
