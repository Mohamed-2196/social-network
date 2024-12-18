import React from 'react'
import { FaBell, FaComments, FaUser } from 'react-icons/fa'

export default function Nav() {
    return (
    <>
    <nav className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <a className="btn btn-ghost normal-case text-xl">SocialApp</a>
        </div>
        <div className="flex-none gap-2">
          <div className="form-control">
            <input type="text" placeholder="Search users" className="input input-bordered w-24 md:w-auto" />
          </div>
          <button className="btn btn-ghost btn-circle">
            <FaUser />
          </button>
          <button className="btn btn-ghost btn-circle">
            <div className="indicator">
              <FaBell />
              <span className="badge badge-xs badge-primary indicator-item">3</span>
            </div>
          </button>
          <button className="btn btn-ghost btn-circle">
            <FaComments />
          </button>
        </div>
      </nav>
    </>
  )
}

