namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : BaseController
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto model)
        {
            var response = await _userService.CreateUser(model);
            if(response.Message== "User registration failed")
                return BadRequest();
            return Ok(response);
        }

    }
}
