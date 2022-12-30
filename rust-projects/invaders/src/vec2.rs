#[derive(std::marker::Copy)]
pub struct Vec2 {
    pub x: f64,
    pub y: f64,
}

impl Vec2 {
    pub fn new() -> Self {
        Self { x: 0., y: 0. }
    }

    pub fn magnitude(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }

    pub fn clamp(&mut self, top_left_bound: Vec2, bottom_right_bound: Vec2) -> bool {
        let mut was_clamped = false;
        if self.x > bottom_right_bound.x {
            self.x = bottom_right_bound.x;
            was_clamped = true;
        } else if self.x < top_left_bound.x {
            self.x = top_left_bound.x;
            was_clamped = true;
        }

        if self.y > bottom_right_bound.y {
            self.y = bottom_right_bound.y;
            was_clamped = true;
        } else if self.y < top_left_bound.y {
            self.y = top_left_bound.y;
            was_clamped = true;
        }

        was_clamped
    }

    pub fn clear(&mut self) {
        self.x = 0.;
        self.y = 0.;
    }
}

impl Clone for Vec2 {
    fn clone(&self) -> Self {
        Self {
            x: self.x,
            y: self.y,
        }
    }
}

impl std::ops::Div<f64> for Vec2 {
    type Output = Vec2;

    fn div(self, rhs: f64) -> Self::Output {
        Vec2 {
            x: self.x / rhs,
            y: self.y / rhs,
        }
    }
}

impl std::ops::AddAssign<Vec2> for Vec2 {
    fn add_assign(&mut self, rhs: Vec2) {
        self.x += rhs.x;
        self.y += rhs.y;
    }
}

impl std::ops::SubAssign<Vec2> for Vec2 {
    fn sub_assign(&mut self, rhs: Vec2) {
        self.x -= rhs.x;
        self.y -= rhs.y;
    }
}

impl std::ops::Add<Vec2> for Vec2 {
    type Output = Vec2;

    fn add(self, rhs: Vec2) -> Self::Output {
        Vec2 {
            x: self.x + rhs.x,
            y: self.y + rhs.y,
        }
    }
}

impl std::fmt::Display for Vec2 {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "({}, {})", &self.x, self.y)
    }
}
