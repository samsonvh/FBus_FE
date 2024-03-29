import jwt_decode from "jwt-decode";
export function isTokenExpired() {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user){
    const decodedToken = jwt_decode(user.accessToken);
    const currentTime = Date.now() / 1000;
    return decodedToken.exp < currentTime;
  }
}

  